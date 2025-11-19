# Keka Integration Setup

## Configuration

The Keka integration is configured with the following credentials for **Dynamicelements** company:

### Backend Configuration
- **Company Name**: dynamicelements
- **Client ID**: ad066272-fc26-4cb6-8013-0c917b338282
- **Client Secret**: L0lrngtVKLGBMimNzYNk
- **API Key**: 60X4if7aetHEiCoq1gOhRszm3JhIbMnx3MMhCRZnKhs=

### Environment Variables
Set these in your `.env` file:
```env
KEKA_COMPANY_NAME=dynamicelements
KEKA_CLIENT_ID=ad066272-fc26-4cb6-8013-0c917b338282
KEKA_CLIENT_SECRET=L0lrngtVKLGBMimNzYNk
KEKA_API_KEY=60X4if7aetHEiCoq1gOhRszm3JhIbMnx3MMhCRZnKhs=
KEKA_TIMEOUT=30000
```

---

## Backend API Endpoints

### Sync Operations

#### 1. Test Keka Connection
```bash
POST /api/keka/sync/test
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "message": "✅ Keka API connection successful"
}
```

#### 2. Sync Clients from Keka PSA
```bash
POST /api/keka/sync/clients
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "synced": 5,
  "failed": 0,
  "errors": [],
  "message": "Synced 5 clients"
}
```

#### 3. Sync Projects from Keka PSA
```bash
POST /api/keka/sync/projects
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "synced": 3,
  "failed": 0,
  "errors": [],
  "message": "Synced 3 projects"
}
```

#### 4. Sync Employees from Keka HRIS
```bash
POST /api/keka/sync/employees
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "synced": 25,
  "failed": 0,
  "errors": [],
  "message": "Synced 25 employees"
}
```

#### 5. Sync All (Clients + Projects + Employees)
```bash
POST /api/keka/sync/all
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "clients": { "success": true, "synced": 5, ... },
  "projects": { "success": true, "synced": 3, ... },
  "employees": { "success": true, "synced": 25, ... },
  "duration": "2.45s",
  "message": "Keka sync complete"
}
```

#### 6. Get Sync Status
```bash
GET /api/keka/sync/status
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "clients": {
    "lastSync": "2025-11-13T15:30:00.000Z",
    "count": 12
  },
  "projects": {
    "lastSync": "2025-11-13T15:30:00.000Z",
    "count": 8
  },
  "employees": {
    "lastSync": "2025-11-13T15:30:00.000Z",
    "count": 42
  }
}
```

---

## API Data Mapping

### Clients
**Keka Source** → **Our Database**
- `id` → `keka_id`
- `name` → `name`
- `email` → `email`
- `phone` → `phone`
- `address` → `address`
- `city` → `city`
- `state` → `state`
- `country` → `country`
- `postalCode` → `postal_code`
- `isActive` → `is_active`

### Projects
**Keka Source** → **Our Database**
- `id` → `keka_id`
- `name` → `name`
- `description` → `description`
- `clientId` → matched to our `accounts.id`
- `startDate` → `start_date`
- `endDate` → `end_date`
- `budget` → `budget`
- `status` → `status`

### Employees
**Keka Source** → **Our Database**
- `id` → `keka_employee_id`
- `firstName` → `first_name`
- `lastName` → `last_name`
- `email` → `email`
- `department` → `department`
- `designation` → `designation`
- `isActive` → `is_active`

---

## Keka API Endpoints Used

### PSA API
- `GET https://dynamicelements.keka.com/api/v1/psa/clients` - List all clients
- `GET https://dynamicelements.keka.com/api/v1/psa/clients/:id` - Get specific client
- `GET https://dynamicelements.keka.com/api/v1/psa/projects` - List all projects
- `GET https://dynamicelements.keka.com/api/v1/psa/projects/:id` - Get specific project

### HRIS API
- `GET https://dynamicelements.keka.com/api/v1/hris/employees?inProbation=false&inNoticePeriod=false` - List active employees
- `GET https://dynamicelements.keka.com/api/v1/hris/employees/:id` - Get specific employee

---

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── keka.ts                    # Keka configuration
│   ├── integrations/
│   │   ├── keka.ts                    # Keka API client
│   │   ├── keka-clients-sync.ts       # Clients sync service
│   │   ├── keka-projects-sync.ts      # Projects sync service
│   │   └── keka-employees-sync.ts     # Employees sync service
│   ├── controllers/
│   │   └── keka-sync.ts               # Keka sync endpoints
│   └── routes/
│       └── index.ts                   # Routes including keka
```

---

## Features

✅ **Automatic Data Mapping** - Keka data automatically mapped to our schema  
✅ **Upsert Operations** - Updates existing records, creates new ones  
✅ **Error Handling** - Comprehensive error handling and logging  
✅ **Retry Logic** - Automatic retries on failed requests  
✅ **Filtering** - Excludes probation and notice period employees  
✅ **JWT Protected** - All endpoints require authentication  
✅ **Sync Status** - Track sync operations and timestamps  
✅ **Bulk Operations** - Sync all data at once  

---

## Testing

### cURL Examples

**Test Connection:**
```bash
curl -X POST http://localhost:3001/api/keka/sync/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Sync All Data:**
```bash
curl -X POST http://localhost:3001/api/keka/sync/all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Get Status:**
```bash
curl -X GET http://localhost:3001/api/keka/sync/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Frontend Integration

Add the following section to your Clients, Projects, or Employees pages:

```html
<!-- Keka Sync Section -->
<div class="keka-sync-section">
  <h3>Keka Integration</h3>
  <button class="btn btn-primary" onclick="syncFromKeka('clients')">
    Sync Clients from Keka
  </button>
  <button class="btn btn-primary" onclick="syncFromKeka('projects')">
    Sync Projects from Keka
  </button>
  <button class="btn btn-primary" onclick="syncFromKeka('employees')">
    Sync Employees from Keka
  </button>
  <button class="btn btn-success" onclick="syncAllFromKeka()">
    Sync All Data
  </button>
  <div id="syncStatus" class="sync-status"></div>
</div>
```

JavaScript Handler:
```javascript
async function syncFromKeka(module) {
  const token = localStorage.getItem('token');
  const statusEl = document.getElementById('syncStatus');
  
  try {
    statusEl.innerHTML = '⏳ Syncing...';
    
    const response = await fetch(`http://localhost:3001/api/keka/sync/${module}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      statusEl.innerHTML = `✅ ${data.message}`;
      setTimeout(() => { 
        statusEl.innerHTML = '';
        location.reload(); 
      }, 2000);
    } else {
      statusEl.innerHTML = `❌ ${data.message || 'Sync failed'}`;
    }
  } catch (error) {
    statusEl.innerHTML = `❌ Error: ${error.message}`;
  }
}

async function syncAllFromKeka() {
  const token = localStorage.getItem('token');
  const statusEl = document.getElementById('syncStatus');
  
  try {
    statusEl.innerHTML = '⏳ Syncing all data...';
    
    const response = await fetch('http://localhost:3001/api/keka/sync/all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      statusEl.innerHTML = `✅ Synced in ${data.duration}`;
      setTimeout(() => { 
        statusEl.innerHTML = '';
        location.reload(); 
      }, 2000);
    } else {
      statusEl.innerHTML = `❌ Sync failed`;
    }
  } catch (error) {
    statusEl.innerHTML = `❌ Error: ${error.message}`;
  }
}
```

---

## Troubleshooting

### Connection Failed
- Check internet connection
- Verify company name matches Keka instance
- Check API credentials in .env file
- Verify firewall allows HTTPS to Keka API

### Sync Errors
- Check JWT token validity
- Verify company_id in token matches database records
- Review error messages in application logs
- Check database connection

### Data Not Syncing
- Verify Keka account has data in PSA/HRIS modules
- Check employee filters (probation, notice period)
- Review sync status endpoint
- Check database for existing records with keka_id

---

## Next Steps

1. ✅ Backend Keka integration complete
2. ⏳ Frontend UI components needed
3. ⏳ Schedule automatic syncs (optional)
4. ⏳ Add audit logs for sync operations
5. ⏳ Implement conflict resolution for duplicates

