# Notification System Design

Campus notification platform design covering REST APIs, database architecture, query optimization, scalability, mass notification processing, and priority inbox implementation.

---

## Stage 1 — REST API Design

### Overview

REST APIs for a campus notification platform where students receive placement, event, and result notifications with support for realtime delivery.

### Authentication Assumptions

- JWT Bearer tokens issued after student login
- Role-based access: `student`, `admin`, `faculty`
- Admin/faculty can create notifications; students can only read/update their own

### Naming Conventions

- Plural nouns for collections: `/notifications`
- kebab-case for multi-word paths
- camelCase in JSON bodies
- ISO 8601 timestamps

### Endpoints

#### POST /notifications

Create a notification (admin/system).

**Request:**

```json
{
  "studentIds": [1042, 1043],
  "type": "Placement",
  "title": "Google hiring drive",
  "message": "On-campus interview on April 25",
  "metadata": { "company": "Google" }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Notification created",
  "data": {
    "notificationId": "notif-uuid",
    "recipientCount": 2
  }
}
```

#### GET /notifications

List notifications for authenticated student.

**Query params:** `page`, `limit`, `type`, `isRead`, `sort=createdAt:desc`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "notif-uuid",
        "type": "Placement",
        "title": "Google hiring drive",
        "message": "On-campus interview",
        "isRead": false,
        "createdAt": "2026-04-22T17:51:18Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 145,
      "totalPages": 8
    }
  }
}
```

#### GET /notifications/unread

Shortcut for unread notifications with same pagination/filtering.

**Response (200):** Same schema as above, filtered `isRead=false`.

#### PATCH /notifications/:id/read

Mark single notification as read.

**Response (200):**

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { "id": "notif-uuid", "isRead": true }
}
```

#### DELETE /notifications/:id

Soft-delete or hard-delete notification for student.

**Response (204):** No content.

### Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |

### Pagination

- Cursor-based pagination for large feeds (recommended at scale)
- Offset pagination acceptable for MVP: `?page=1&limit=20`
- Include `total`, `hasNext`, `nextCursor` in response

### Filtering

| Param | Example |
|-------|---------|
| `type` | `Placement`, `Result`, `Event` |
| `isRead` | `true`, `false` |
| `fromDate` | `2026-04-01` |
| `toDate` | `2026-04-30` |

### Realtime: WebSocket vs SSE

| Approach | Pros | Cons |
|----------|------|------|
| **WebSocket** | Bidirectional, low latency | Stateful connections, harder to scale |
| **SSE** | Simple, HTTP-friendly, auto-reconnect | Unidirectional only |
| **Polling** | Easiest | High load, poor UX |

**Recommendation:** SSE or WebSocket for realtime; fallback polling every 30–60s for legacy clients.

**SSE example:**

```
GET /notifications/stream
Accept: text/event-stream

event: notification
data: {"id":"...","type":"Placement","message":"..."}
```

---

## Stage 2 — Database Design

### SQL vs NoSQL

| Factor | PostgreSQL (SQL) | MongoDB (NoSQL) |
|--------|------------------|-----------------|
| Relationships | Strong FK support | Embedded docs |
| ACID | Full | Eventual (configurable) |
| Complex queries | Excellent | Good |
| Schema flexibility | Migrations needed | Flexible |
| Unread counts | Easy with indexes | Aggregation pipelines |

**Recommendation:** **PostgreSQL** as primary store + **Redis** for hot unread counts and caching.

### Justification

- Notifications have structured relationships (student, type, read status)
- Need transactional consistency when marking read + updating counts
- Complex filtering and reporting (placements in last 7 days)
- Redis complements PostgreSQL for sub-millisecond unread badge counts

### Schema Design

#### students

```sql
CREATE TABLE students (
  id          BIGSERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### notifications

```sql
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      BIGINT NOT NULL REFERENCES students(id),
  type            notification_type NOT NULL,
  title           VARCHAR(500),
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
```

#### Read status (alternative normalized approach)

For broadcast notifications to many students:

```sql
CREATE TABLE notification_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL,
  student_id      BIGINT NOT NULL REFERENCES students(id),
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (notification_id, student_id)
);
```

### Sample Queries

**Unread for student:**

```sql
SELECT id, type, message, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 20;
```

**Mark as read:**

```sql
UPDATE notifications
SET is_read = TRUE, read_at = NOW()
WHERE id = $1 AND student_id = 1042;
```

### Indexing Strategy

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (student_id, is_read, created_at DESC);
```

### Partitioning

- Partition `notifications` by `created_at` monthly for archival
- Keeps active partitions small and queries fast

### Scalability

- Read replicas for notification feed queries
- Write primary for inserts/updates
- Redis cache: `unread_count:student:{id}`

---

## Stage 3 — Query Optimization

### Slow Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

### Why It Is Slow

1. **`SELECT *`** — fetches unnecessary columns (large `message` text)
2. **Full table scan** — without proper composite index, PostgreSQL scans all rows
3. **Sorting cost** — `ORDER BY createdAt DESC` requires sort step if index doesn't cover order
4. **Low selectivity alone** — `isRead = false` alone is not selective enough globally

### Indexing Strategy

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (student_id, is_read, created_at DESC);
```

**Why this works:**

- `student_id` — high selectivity first column
- `is_read` — filters unread within student partition
- `created_at DESC` — index-order matches `ORDER BY`, avoids separate sort

### Why Indexing Every Column Is Bad

| Problem | Impact |
|---------|--------|
| Write amplification | Every INSERT/UPDATE updates many indexes |
| Storage overhead | Indexes can exceed table size |
| Planner confusion | Too many indexes → suboptimal plan choices |
| Maintenance cost | Vacuum/reindex overhead |

**Rule:** Index based on **query patterns**, not columns in isolation.

### Placement Notifications — Last 7 Days

```sql
SELECT DISTINCT n.student_id
FROM notifications n
WHERE n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days';
```

**Supporting index:**

```sql
CREATE INDEX idx_notifications_type_created
ON notifications (type, created_at DESC)
WHERE type = 'Placement';
```

Partial index reduces size when only placement queries need optimization.

---

## Stage 4 — Scalability

### DB Overload

**Symptoms:** Connection pool exhaustion, slow feeds, replication lag.

**Mitigations:**

- Connection pooling (PgBouncer)
- Read replicas for GET traffic
- CQRS: separate write and read models

### Caching (Redis)

```
GET unread_count:1042
SET unread_count:1042 12 EX 300
```

- Cache unread counts with TTL
- Invalidate on PATCH read
- Cache recent notification pages

### Polling vs WebSocket

| Strategy | When to use |
|----------|-------------|
| Polling | Low-traffic MVP |
| SSE | One-way push, simpler infra |
| WebSocket | Chat-like realtime, high engagement |

### Fanout Problem

Broadcast to 50,000 students:

- **Bad:** 50,000 synchronous INSERTs in API request
- **Good:** Publish event → queue → workers batch insert

### CQRS

- **Write model:** normalized, transactional
- **Read model:** denormalized feed per student in Redis/Elasticsearch

### Denormalization

Store `student_id`, `type`, `is_read`, `created_at` together in feed documents to avoid JOINs on hot path.

### Pagination

- Cursor-based: `?cursor=2026-04-22T17:51:18Z&id=uuid`
- Avoid `OFFSET` for deep pages (scans skipped rows)

### Batching

- Batch INSERT 500 rows per transaction in workers
- Batch push notifications to FCM/APNs

### CDN

- Static assets only (icons, email templates)
- API responses generally not CDN-cached (personalized)

### Read Replicas

- Route feed GETs to replicas
- Writes to primary
- Accept eventual consistency for non-critical reads

### Tradeoff Summary

| Strategy | Benefit | Cost |
|----------|---------|------|
| Redis cache | Fast reads | Consistency complexity |
| Read replicas | Scale reads | Replication lag |
| CQRS | Optimized paths | System complexity |
| WebSocket | Realtime UX | Stateful scaling |
| Denormalization | Faster queries | Sync overhead |

---

## Stage 5 — Mass Notification System

### Bad Pseudocode (Provided Pattern)

```text
for each student in all_students:
    send_email(student)
    send_sms(student)
    update_database(student)
```

### Issues Identified

| Issue | Problem |
|-------|---------|
| Sequential processing | O(n) blocking; hours for large cohorts |
| Blocking I/O | API thread waits on SMTP/SMS latency |
| No retries | Transient failures lose notifications |
| Unreliable | Single crash loses entire batch |
| Tightly coupled | API handles delivery + persistence |
| Poor scalability | Cannot horizontally scale senders |

### Redesigned Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Admin API  │────►│  Event       │────►│  Kafka / SQS /  │
│  POST /send │     │  Publisher   │     │  RabbitMQ       │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                     ┌─────────────────────────────┼─────────────────────────────┐
                     ▼                             ▼                             ▼
              ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
              │  Email      │              │  SMS        │              │  Push       │
              │  Worker     │              │  Worker     │              │  Worker     │
              └──────┬──────┘              └──────┬──────┘              └──────┬──────┘
                     │                             │                             │
                     └─────────────────────────────┼─────────────────────────────┘
                                                   ▼
                                          ┌─────────────────┐
                                          │  Audit DB + DLQ │
                                          └─────────────────┘
```

### Improved Pseudocode

```text
function publishMassNotification(campaign):
    event = buildEvent(campaign)
    messageId = queue.publish("notifications.send", event)
    return { jobId: messageId, status: "accepted" }

function notificationWorker(message):
    try:
        recipients = batchFetchStudents(message.studentIds, size=500)
        for batch in recipients:
            deliveries = []
            for student in batch:
                deliveries.push(buildDeliveryRecord(student, message))
            db.bulkInsert(deliveries)
            for channel in message.channels:
                provider.sendAsync(channel, batch)
            queue.ack(message)
    except TransientError as e:
        queue.retry(message, backoff=exponential)
    except PermanentError as e:
        deadLetterQueue.send(message, reason=e)
```

### Failure Handling

| Failure | Action |
|---------|--------|
| SMTP timeout | Retry 3× with exponential backoff |
| Invalid phone | Skip, log permanent failure |
| DB deadlock | Retry transaction |
| Max retries exceeded | Move to DLQ, alert ops |

### Queue Technology

| System | Best for |
|--------|----------|
| **Kafka** | High throughput, event replay, analytics |
| **RabbitMQ** | Complex routing, priority queues |
| **AWS SQS** | Managed, simple fanout in AWS |

### Scalability

- Horizontal worker scaling based on queue depth
- Partition Kafka topic by `student_id % N`
- Idempotency keys prevent duplicate sends on retry

---

## Stage 6 — Priority Inbox Implementation

### Problem

Maintain **top 10 highest priority unread** notifications where:

- Priority: **Placement > Result > Event**
- Same priority: **newest first**
- Notifications arrive continuously (streaming-friendly)

### Implementation Location

Working code: `vehicle_maintenance_scheduler/src/algorithms/priorityInbox.js`

Exposed via: `GET /api/notifications/priority-inbox`

### Algorithm: Min-Heap Top-K

- Use **min-heap** of size `k=10`
- Heap root = **worst** notification currently in top-10
- For each new unread notification:
  - If heap size < k → push
  - Else if better than root → pop root, push new
- Final sort for output: best-first

**Complexity:** `O(n log k)` where `k=10`

### Priority Mapping

```javascript
Placement → 3
Result    → 2
Event     → 1
```

### Output Format

```json
[
  {
    "ID": "uuid",
    "Type": "Placement",
    "Message": "Company hiring",
    "Timestamp": "2026-04-22 17:51:18"
  }
]
```

### Logging (via Log middleware)

- Notifications fetched from API
- Heap insertions and evictions
- Top-10 generation completion
- API/auth failures

### Screenshots

See `screenshots/` folder for:

- `priority-inbox.png`
- `logs-dashboard.png`
- `postman-collection.png`

---

## Summary

| Stage | Focus |
|-------|-------|
| 1 | REST API design with pagination, filtering, realtime |
| 2 | PostgreSQL + Redis, normalized schema |
| 3 | Composite indexing, query optimization |
| 4 | Caching, fanout, CQRS, read replicas |
| 5 | Queue-based async mass notifications |
| 6 | Min-heap priority inbox — implemented in code |

This design balances **correctness**, **performance**, and **operational scalability** for a production campus notification platform.
