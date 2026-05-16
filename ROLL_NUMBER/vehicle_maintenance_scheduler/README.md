# Vehicle Maintenance Scheduler

Production-style REST API for managing vehicles and maintenance records, with integrated remote logging via the reusable `logging_middleware` package.

## Features

- Create, read, and delete vehicles
- Add and retrieve maintenance history
- List vehicles with upcoming service dates
- JSON file persistence
- Centralized error handling and validation
- Strategic remote logging across routes, services, and handlers

## Setup

### 1. Register Logging Client

Complete registration in `logging_middleware` first and copy `CLIENT_ID` / `CLIENT_SECRET` to this project's `.env`.

### 2. Installation

```bash
cd vehicle_maintenance_scheduler
npm install
```

### 3. Environment Variables

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `UPCOMING_SERVICE_DAYS` | Window for upcoming service query |
| `EVALUATION_BASE_URL` | Logging API base URL |
| `EMAIL`, `NAME`, `ROLL_NO`, etc. | Evaluation service credentials |
| `CLIENT_ID`, `CLIENT_SECRET` | From registration |

### 4. Run

```bash
npm run dev
```

## API Endpoints

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/vehicles` | Create vehicle |
| GET | `/vehicles` | Get all vehicles |
| GET | `/vehicles/upcoming-service` | Vehicles due for service |
| GET | `/vehicles/:id` | Get vehicle by ID |
| DELETE | `/vehicles/:id` | Delete vehicle |
| POST | `/vehicles/:id/maintenance` | Add maintenance record |
| GET | `/vehicles/:id/maintenance` | Get maintenance history |

## Example Requests

### Create Vehicle

```bash
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "ownerName": "John Doe",
    "vehicleNumber": "TN09AB1234",
    "brand": "Toyota",
    "model": "Innova",
    "lastServiceDate": "2025-12-01",
    "mileage": 45000
  }'
```

### Get All Vehicles

```bash
curl http://localhost:3000/api/vehicles
```

### Get Vehicle By ID

```bash
curl http://localhost:3000/api/vehicles/<vehicle-id>
```

### Add Maintenance Record

```bash
curl -X POST http://localhost:3000/api/vehicles/<vehicle-id>/maintenance \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "Oil Change",
    "description": "Synthetic oil and filter replacement",
    "cost": 2500,
    "serviceDate": "2026-01-15",
    "nextRecommendedDate": "2026-07-15"
  }'
```

### Get Maintenance History

```bash
curl http://localhost:3000/api/vehicles/<vehicle-id>/maintenance
```

### Upcoming Service Vehicles

```bash
curl "http://localhost:3000/api/vehicles/upcoming-service?days=30"
```

### Delete Vehicle

```bash
curl -X DELETE http://localhost:3000/api/vehicles/<vehicle-id>
```

## Response Format

**Success:**

```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {}
}
```

**Error:**

```json
{
  "success": false,
  "message": "Vehicle not found with id: abc"
}
```

## Project Structure

```
vehicle_maintenance_scheduler/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   ├── data/
│   └── validators/
├── server.js
├── package.json
└── README.md
```

## Logging Integration

The app uses `safeLog()` wrapper around `Log()` from `logging_middleware`:

- **route** — incoming requests and 404s
- **middleware** — validation failures
- **controller** — operation outcomes and errors
- **service** — business logic events
- **db** — file read/write operations
- **config** — application startup
- **handler** — global error handler

Remote logging failures are caught locally so API responses are not blocked.

## Screenshots

<!-- Add screenshots of API responses and log dashboard here -->

| API Health | Create Vehicle | Remote Logs |
|------------|----------------|-------------|
| _placeholder_ | _placeholder_ | _placeholder_ |

## Data Models

### Vehicle

| Field | Type |
|-------|------|
| id | string (UUID) |
| ownerName | string |
| vehicleNumber | string |
| brand | string |
| model | string |
| lastServiceDate | date string |
| nextServiceDate | date string |
| mileage | number |
| createdAt | ISO timestamp |

### Maintenance

| Field | Type |
|-------|------|
| id | string (UUID) |
| vehicleId | string |
| serviceType | string |
| description | string |
| cost | number |
| serviceDate | date string |
| nextRecommendedDate | date string \| null |
