# Step-by-Step Testing Guide

## Prerequisites

- Node.js 18+ installed
- Your evaluation portal credentials: **email, name, mobile, GitHub username, roll number, access code**

---

## Step 1 — Fill your credentials (one file)

Open **`ROLL_NUMBER/.env`** and set these 6 values:

```env
EMAIL=your.email@college.edu
NAME=Your Full Name
MOBILE_NO=9876543210
GITHUB_USERNAME=your-github-id
ROLL_NO=your_roll_number
ACCESS_CODE=code_from_portal
```

Leave `CLIENT_ID` and `CLIENT_SECRET` empty for now.

---

## Step 2 — Install dependencies

Open PowerShell in the project root (either works):

```powershell
cd E:\afford
npm run install:all
```

Or:

```powershell
cd E:\afford\ROLL_NUMBER
npm install
npm run install:all
```

---

## Step 3 — Register and sync `.env`

This registers with the evaluation API and saves `CLIENT_ID` / `CLIENT_SECRET` to all `.env` files:

```powershell
npm run setup
```

**Expected output:**

```
Synced → logging_middleware/.env
Synced → vehicle_maintenance_scheduler/.env
Registering with evaluation service...
Registration successful — CLIENT_ID and CLIENT_SECRET saved to .env files.
Setup complete.
```

If registration fails, double-check `EMAIL`, `ROLL_NO`, and `ACCESS_CODE`.

---

## Step 4 — Start the server

```powershell
npm run dev
```

**Expected console output:**

```
Vehicle Maintenance Scheduler running on port 3000
```

Keep this terminal open.

---

## Step 5 — Test health (no auth needed)

New PowerShell window:

```powershell
curl http://localhost:3000/api/health
```

**Expected:**

```json
{
  "success": true,
  "message": "Vehicle Maintenance Scheduler microservice is running",
  "data": { "status": "healthy" }
}
```

---

## Step 6 — Test knapsack schedule (all depots)

```powershell
curl http://localhost:3000/api/schedule
```

**Expected:** `success: true` with an array of depot schedules containing `depotId`, `mechanicHours`, `selectedTasks`, `totalDuration`, `totalImpact`.

---

## Step 7 — Test single depot schedule

```powershell
curl http://localhost:3000/api/schedule/1
```

Replace `1` with a depot ID from the previous response.

---

## Step 8 — Test priority inbox (Stage 6)

```powershell
curl http://localhost:3000/api/notifications/priority-inbox
```

**Expected:** Top unread notifications ordered by Placement > Result > Event, newest first within each type.

---

## Step 9 — Verify remote logging

1. Open the evaluation service logs dashboard (URL from your portal).
2. Confirm entries for route hits, API fetches, knapsack completion, etc.
3. Save a screenshot to `screenshots/logs-dashboard.png`.

---

## Step 10 — Test with Postman (optional)

| Method | URL |
|--------|-----|
| GET | `http://localhost:3000/api/health` |
| GET | `http://localhost:3000/api/schedule` |
| GET | `http://localhost:3000/api/schedule/1` |
| GET | `http://localhost:3000/api/notifications/priority-inbox` |

Save responses as screenshots in `screenshots/`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `EADDRINUSE` port 3000 | Stop old server: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess \| Stop-Process` |
| `Auth config missing` | Run `npm run setup` again after filling `.env` |
| `Unable to fetch depots API` | Check internet; verify token with `npm run setup` |
| Empty schedule | Evaluation API may return empty data — check API response in logs |

---

## Quick checklist

- [ ] `.env` filled with 6 personal fields
- [ ] `npm run setup` succeeded
- [ ] `npm run dev` running
- [ ] `/api/health` returns success
- [ ] `/api/schedule` returns optimized data
- [ ] `/api/notifications/priority-inbox` returns top 10
- [ ] Remote logs visible in dashboard
- [ ] Screenshots saved in `screenshots/`
