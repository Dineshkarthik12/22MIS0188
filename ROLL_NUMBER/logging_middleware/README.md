# Logging Middleware

Reusable Node.js logging package that authenticates with the evaluation service and sends structured logs to a remote logging API.

## Features

- Input validation for stack, level, package, and message
- Centralized Axios HTTP client
- Token caching with automatic refresh on expiration
- Auth retry (once) on failure
- Timestamped log messages
- Descriptive error handling

## Setup

### 1. Installation

```bash
cd logging_middleware
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `EVALUATION_BASE_URL` | Base URL for evaluation APIs |
| `EMAIL` | Your registered email |
| `NAME` | Your full name |
| `MOBILE_NO` | Mobile number |
| `GITHUB_USERNAME` | GitHub username |
| `ROLL_NO` | Roll number |
| `ACCESS_CODE` | Provided access code |
| `CLIENT_ID` | From registration |
| `CLIENT_SECRET` | From registration |

### 3. Register Client (One-time)

```bash
npm run register
```

Copy the printed `CLIENT_ID` and `CLIENT_SECRET` into your `.env` file.

### 4. Development

```bash
npm run dev
```

Runs the registration script with nodemon (useful when testing registration flow).

## Usage

```javascript
const { Log } = require('./src/logger');

await Log('backend', 'info', 'service', 'Vehicle service initialized successfully');
```

### Function Signature

```javascript
Log(stack, level, packageName, message)
```

### Allowed Values

**Stack:** `backend`, `frontend`

**Level:** `debug`, `info`, `warn`, `error`, `fatal`

**Backend Packages:** `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`, `auth`, `config`, `middleware`, `utils`

## How the Logger Works

```
┌─────────────┐     validate      ┌──────────────┐
│  Log()      │ ───────────────►  │  logService  │
└─────────────┘                   └──────┬───────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
             ┌──────────┐        ┌──────────┐        ┌──────────┐
             │ getToken │        │ POST     │        │ on 401   │
             │ (cache)  │        │ /logs    │        │ refresh  │
             └──────────┘        └──────────┘        └──────────┘
```

1. Validates inputs against allowed constants
2. Prepends ISO timestamp to the message
3. Retrieves cached access token or authenticates via `/auth`
4. Sends log payload to `/logs` with Bearer token
5. On 401, clears cache, re-authenticates, and retries once

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/register` | Obtain clientID and clientSecret |
| POST | `/auth` | Obtain access_token |
| POST | `/logs` | Submit log entry |

## Example Log Payload

```json
{
  "stack": "backend",
  "level": "info",
  "package": "route",
  "message": "[2026-05-16T10:00:00.000Z] GET /api/vehicles route hit"
}
```

## Screenshots

<!-- Add screenshots of successful registration and log submission here -->

| Registration Success | Log Submission |
|---------------------|----------------|
| _placeholder_ | _placeholder_ |

## Error Handling

The logger throws descriptive errors for:

- Invalid stack, level, or package values
- Missing or empty messages
- Registration/auth configuration gaps
- API failures after retry
