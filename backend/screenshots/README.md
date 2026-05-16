# Screenshots

Place submission screenshots in this folder.

## Required captures

| File (suggested name) | Description |
|-----------------------|-------------|
| `auth-success.png` | Successful registration/auth with evaluation service |
| `logs-dashboard.png` | Remote logging middleware entries in evaluation dashboard |
| `schedule-all.png` | `GET /api/schedule` Postman/API output |
| `schedule-depot.png` | `GET /api/schedule/:depotId` output |
| `priority-inbox.png` | `GET /api/notifications/priority-inbox` output |
| `postman-collection.png` | Postman collection or environment setup |

## External API Manual Tests

Here are the manual Postman tests executed against the protected external evaluation APIs:

### 1. Notifications API
![Notifications API](external-notifications.png)

### 2. Logs API
![Logs API](external-logs.png)

### 3. Depots API
![Depots API](external-depots.png)

### 4. Vehicles API
![Vehicles API](external-vehicles.png)

## Local API Manual Tests

Here are the manual PowerShell tests executed against the local backend APIs:

### 1. Health Endpoint (`GET /api/health`)
![Health Endpoint](health-endpoint.png)

### 2. All Schedules (`GET /api/schedule`)
![All Schedules](schedule-all.png)

### 3. Single Depot Schedule (`GET /api/schedule/1`)
![Single Depot Schedule](schedule-depot.png)

### 4. Priority Inbox (`GET /api/notifications/priority-inbox`)
![Priority Inbox](priority-inbox.png)

## Related documentation

- `../vehicle_maintenance_scheduler/README.md`
- `../logging_middleware/README.md`
