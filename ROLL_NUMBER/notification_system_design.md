# Notification System Design

Design document for a scalable notification system supporting vehicle maintenance reminders, service alerts, and multi-channel delivery.

---

## 1. High-Level Architecture

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────┐
│  REST API    │────►│  Event       │────►│  Message Queue  │
│  (Scheduler) │     │  Publisher   │     │  (Redis/SQS)    │
└──────────────┘     └──────────────┘     └────────┬────────┘
                                                    │
                     ┌──────────────────────────────┼──────────────────────────────┐
                     ▼                              ▼                              ▼
              ┌─────────────┐               ┌─────────────┐               ┌─────────────┐
              │  Email      │               │  SMS        │               │  Push       │
              │  Worker     │               │  Worker     │               │  Worker     │
              └──────┬──────┘               └──────┬──────┘               └──────┬──────┘
                     │                              │                              │
                     └──────────────────────────────┼──────────────────────────────┘
                                                    ▼
                                          ┌─────────────────┐
                                          │  Notification   │
                                          │  Log / Audit DB │
                                          └─────────────────┘
```

### Components

| Component | Responsibility |
|-----------|----------------|
| API Layer | Accepts notification triggers and schedules |
| Event Publisher | Normalizes events and enqueues jobs |
| Message Queue | Decouples producers from consumers |
| Workers | Channel-specific delivery (email, SMS, push) |
| Scheduler/Cron | Periodic scans for due notifications |
| Audit Store | Tracks delivery status and retries |

---

## 2. Notification Flow

```
1. Trigger (API call OR cron scan)
        │
        ▼
2. Build Notification Event
   { userId, vehicleId, channel, template, payload }
        │
        ▼
3. Validate + Deduplicate (idempotency key)
        │
        ▼
4. Enqueue to priority queue
        │
        ▼
5. Worker picks job
        │
        ▼
6. Render template + send via provider
        │
        ▼
7. Update status (sent | failed | retrying)
        │
        ▼
8. Emit metrics + audit log
```

### Maintenance Reminder Example

1. Cron job finds vehicles with `nextServiceDate` within 7 days
2. Publishes `MAINTENANCE_DUE` event per vehicle owner
3. Email worker sends reminder with vehicle details
4. Status stored as `SENT` or scheduled for retry

---

## 3. Queue-Based Processing

### Why a Queue?

- **Decoupling** — API responds immediately; delivery is async
- **Burst handling** — absorbs traffic spikes during batch cron runs
- **Reliability** — failed jobs can be retried without losing events

### Queue Design

```
┌─────────────────────────────────────────────────────────┐
│                    Priority Queues                       │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   HIGH      │   NORMAL    │   LOW       │   DEAD LETTER │
│  (alerts)   │  (reminders)│  (digest)   │  (failed x N) │
└─────────────┴─────────────┴─────────────┴───────────────┘
```

| Queue | Use Case |
|-------|----------|
| HIGH | Critical alerts (overdue service, safety recalls) |
| NORMAL | Standard maintenance reminders |
| LOW | Weekly digests, marketing (opt-in) |
| DLQ | Jobs exceeding max retry attempts |

### Message Schema

```json
{
  "id": "notif-uuid",
  "idempotencyKey": "vehicle-123-2026-05-16",
  "channel": "email",
  "templateId": "maintenance_due",
  "recipient": { "email": "owner@example.com" },
  "payload": {
    "ownerName": "John Doe",
    "vehicleNumber": "TN09AB1234",
    "nextServiceDate": "2026-05-20"
  },
  "attempt": 0,
  "maxAttempts": 5,
  "scheduledAt": "2026-05-16T08:00:00Z"
}
```

---

## 4. Retry Mechanism

### Exponential Backoff

| Attempt | Delay |
|---------|-------|
| 1 | 30 seconds |
| 2 | 2 minutes |
| 3 | 10 minutes |
| 4 | 1 hour |
| 5 | Move to DLQ |

### Retry Rules

- Retry only on **transient** errors (5xx from provider, timeout, rate limit)
- Do **not** retry on permanent failures (invalid email, unsubscribed user)
- Use **idempotency keys** to prevent duplicate sends on retry

```
Worker ──► Send ──► Success? ──► Mark SENT
                │
                └── Fail (transient)? ──► Re-enqueue with backoff
                              │
                              └── Max attempts? ──► DLQ + alert ops team
```

---

## 5. Scheduler / Cron Design

### Cron Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| `scan_upcoming_service` | Daily 06:00 | Find vehicles due within N days |
| `scan_overdue_service` | Daily 08:00 | Find overdue vehicles, escalate priority |
| `retry_failed_notifications` | Every 15 min | Reprocess retry-eligible jobs |
| `cleanup_old_logs` | Weekly | Archive notifications older than 90 days |

### Scheduler Architecture

```
┌────────────────┐
│  Cron Leader   │  (distributed lock – only one instance runs)
└───────┬────────┘
        │
        ▼
┌────────────────┐     ┌────────────────┐
│  Query DB for  │────►│  Batch publish │
│  due vehicles  │     │  to queue      │
└────────────────┘     └────────────────┘
```

- Use **leader election** (Redis lock) when multiple API instances exist
- Process in **batches** (e.g., 500 vehicles per batch) to avoid memory spikes
- Track last run timestamp to support incremental scans

---

## 6. Scalability Considerations

| Area | Strategy |
|------|----------|
| Horizontal scaling | Stateless API + multiple queue workers |
| Database | Read replicas for cron scans; write primary for audit |
| Caching | Cache user preferences and template metadata in Redis |
| Rate limiting | Per-channel limits to respect provider quotas |
| Partitioning | Shard queue by `userId` or `region` for locality |
| CDN / Templates | Store rendered templates in object storage for audit |

### Load Estimates

- 100K vehicles × daily scan = 100K queue messages/day (~1.2/sec average)
- Peak during cron window: design workers for 10–20x average throughput

---

## 7. Failure Handling

| Failure Type | Handling |
|--------------|----------|
| Provider outage | Retry with backoff; circuit breaker pauses new jobs |
| Invalid recipient | Mark FAILED_PERMANENT; no retry |
| Template error | Alert dev team; route to DLQ immediately |
| Queue unavailable | Buffer in local fallback table; replay when restored |
| Partial batch failure | Continue processing; failed items re-queued individually |

### Circuit Breaker

```
CLOSED ──(failures > threshold)──► OPEN ──(timeout)──► HALF_OPEN ──(success)──► CLOSED
```

When OPEN, API returns `202 Accepted` but queues jobs in a fallback store.

---

## 8. Database Design Ideas

### `notifications`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| idempotency_key | VARCHAR | Unique |
| user_id | UUID | FK |
| vehicle_id | UUID | Nullable |
| channel | ENUM | email, sms, push |
| template_id | VARCHAR | |
| status | ENUM | pending, sent, failed, retrying |
| payload | JSONB | |
| attempts | INT | |
| scheduled_at | TIMESTAMP | |
| sent_at | TIMESTAMP | |
| created_at | TIMESTAMP | |

### `notification_preferences`

| Column | Type |
|--------|------|
| user_id | UUID |
| email_enabled | BOOLEAN |
| sms_enabled | BOOLEAN |
| push_enabled | BOOLEAN |
| reminder_days_before | INT |

### `notification_templates`

| Column | Type |
|--------|------|
| id | VARCHAR |
| channel | ENUM |
| subject | VARCHAR |
| body_template | TEXT |

### Indexes

- `(status, scheduled_at)` — worker polling
- `(user_id, created_at)` — user history
- `(idempotency_key)` — unique constraint

---

## 9. API Considerations

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/notifications/send` | Trigger immediate notification |
| POST | `/notifications/schedule` | Schedule future delivery |
| GET | `/notifications/:id` | Get delivery status |
| GET | `/users/:id/notifications` | List user notification history |
| PUT | `/users/:id/preferences` | Update channel preferences |

### Design Principles

- Return `202 Accepted` for async operations with `notificationId`
- Support **webhooks** for delivery status callbacks from providers
- Authenticate with JWT; authorize per user/tenant
- Rate limit per API key to prevent abuse

---

## 10. Future Improvements

1. **Multi-tenant support** — isolate queues and templates per organization
2. **A/B testing** — experiment with subject lines and send times
3. **Analytics dashboard** — open rates, click-through, delivery latency
4. **In-app notification center** — WebSocket real-time updates
5. **AI-powered send-time optimization** — deliver when user is most likely to engage
6. **WhatsApp / RCS channels** — expand beyond email and SMS
7. **Event sourcing** — full audit trail of notification lifecycle
8. **Geographic routing** — route to regional SMS providers for lower latency and cost

---

## Summary

This design prioritizes **reliability**, **scalability**, and **observability** through queue-based async processing, structured retries, cron-driven maintenance scans, and a clear audit data model—suitable for extending the Vehicle Maintenance Scheduler into a production notification platform.
