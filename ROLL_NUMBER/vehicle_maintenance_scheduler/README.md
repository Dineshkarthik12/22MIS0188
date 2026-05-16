# Vehicle Maintenance Scheduler Microservice

Backend microservice that fetches depot and vehicle maintenance task data from the evaluation service, solves a **0/1 Knapsack** optimization per depot to maximize impact within mechanic hour limits, and maintains a **top-10 priority notification inbox** using a min-heap.

## Architecture

```
server.js
    └── routes/
            ├── /api/schedule          → scheduleController → schedulerService
            └── /api/notifications     → notificationController → priorityInboxService
                    │
                    ├── clients/evaluationApiClient  (depots, vehicles, notifications)
                    ├── clients/tokenManager         (Bearer auth)
                    ├── algorithms/knapsack.js       (DP optimization)
                    └── algorithms/priorityInbox.js  (min-heap top-k)
                    │
                    └── logging_middleware Log()     (remote observability)
```

## Setup

### 1. Register logging client

```bash
cd ../logging_middleware
cp .env.example .env
npm install
npm run register
```

Copy `CLIENT_ID` and `CLIENT_SECRET` into this project's `.env`.

### 2. Install and configure

```bash
cd vehicle_maintenance_scheduler
cp .env.example .env
npm install
```

### 3. Run

```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `3000`) |
| `EVALUATION_BASE_URL` | Evaluation API base URL |
| `EMAIL`, `NAME`, `ROLL_NO`, `ACCESS_CODE` | Auth credentials |
| `CLIENT_ID`, `CLIENT_SECRET` | From registration |
| `API_TIMEOUT` | External API timeout (ms) |
| `PRIORITY_INBOX_SIZE` | Top-k inbox size (default `10`) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/schedule` | Optimized schedules for all depots |
| GET | `/api/schedule/:depotId` | Schedule for one depot |
| GET | `/api/notifications/priority-inbox` | Top-10 priority unread notifications |

## Example Requests

### All depot schedules

```bash
curl http://localhost:3000/api/schedule
```

**Success response:**

```json
{
  "success": true,
  "message": "Schedules generated successfully",
  "data": [
    {
      "depotId": 1,
      "mechanicHours": 60,
      "selectedTasks": [
        { "TaskID": "uuid", "Duration": 5, "Impact": 10 }
      ],
      "totalDuration": 58,
      "totalImpact": 142
    }
  ]
}
```

### Single depot schedule

```bash
curl http://localhost:3000/api/schedule/1
```

### Priority inbox (Stage 6)

```bash
curl http://localhost:3000/api/notifications/priority-inbox
```

## Knapsack Optimization

### Problem

Each depot has limited **mechanic hours** (capacity). Each maintenance task has **duration** (weight) and **impact** (value). Select tasks such that:

1. Total duration ≤ mechanic hours
2. Total impact is **maximized**

This is the classic **0/1 Knapsack** problem (each task selected at most once per depot).

### Algorithm

Implemented in `src/algorithms/knapsack.js` using dynamic programming:

- `dp[i][w]` = maximum impact using first `i` tasks with capacity `w`
- Backtrack to recover selected tasks
- **Time complexity:** `O(n × capacity)`
- **Space complexity:** `O(n × capacity)`

### Per-depot output

```json
{
  "depotId": 1,
  "mechanicHours": 60,
  "selectedTasks": [...],
  "totalDuration": 58,
  "totalImpact": 142
}
```

## Priority Inbox (Stage 6)

Implemented in `src/algorithms/priorityInbox.js`:

- **Priority order:** Placement > Result > Event
- **Tie-break:** newest `Timestamp` first
- **Structure:** min-heap of size `k=10` (root = worst of top-10)
- **Complexity:** `O(n log k)` for streaming-friendly processing

## Logging Integration

All meaningful operations use `Log()` from `logging_middleware` via `safeLog()`:

| Package | Examples |
|---------|----------|
| `auth` | Token refresh, authentication |
| `service` | API fetch, knapsack start/complete |
| `route` | Incoming requests |
| `controller` | Operation failures |
| `handler` | Centralized errors |
| `config` | Server startup |

Remote logging failures do not block API responses.

## Authentication Flow

1. **Register** (one-time) via `logging_middleware` → `CLIENT_ID`, `CLIENT_SECRET`
2. **Auth** → Bearer `access_token` (cached in `tokenManager`)
3. **Protected routes** → `Authorization: Bearer <token>`
4. On **401** → refresh token and retry once

## Screenshots

Add captures to `../screenshots/`:

- Successful auth
- Remote logs dashboard
- Optimized schedule API output
- Priority inbox output
- Postman responses

| Screenshot | Placeholder |
|------------|-------------|
| Auth success | `../screenshots/auth-success.png` |
| Logs | `../screenshots/logs-dashboard.png` |
| Schedule output | `../screenshots/schedule-all.png` |
| Priority inbox | `../screenshots/priority-inbox.png` |
| Postman | `../screenshots/postman-collection.png` |

## Project Structure

```
vehicle_maintenance_scheduler/
├── src/
│   ├── algorithms/     knapsack.js, priorityInbox.js
│   ├── clients/        HTTP + token + evaluation API
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── server.js
├── package.json
└── README.md
```
