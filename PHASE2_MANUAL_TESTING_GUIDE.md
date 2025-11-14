# 🧪 Phase 2 Manual Testing Guide - Complete Workflow

**Date**: November 13, 2025  
**Status**: ✅ Ready for Testing  
**Backend**: http://localhost:3001/api  
**Frontend**: http://localhost:8080  

---

## 🚀 Quick Start

### Prerequisites
Verify both servers are running:

```bash
# Check Backend
curl -s http://localhost:3001/api/health

# Check Frontend
curl -s http://localhost:8080 | grep "Portfolio Management"
```

### Access the Application
- **Frontend**: http://localhost:8080/index.html
- **Backend API**: http://localhost:3001/api

---

## 📋 Testing Scenarios

### Scenario 1: User Registration & Login

**Steps**:
1. Open http://localhost:8080/index.html
2. Click "Login" page (left navigation)
3. Fill in Registration form:
   - Email: `phase2-test-$(date +%s)@test.com`
   - Password: `Phase123!`
   - First Name: `Test`
   - Last Name: `User`
4. Click "Register"
5. Verify success message appears
6. Note the JWT token returned

**Expected Result**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "...",
    "company_id": "..."
  }
}
```

**cURL Alternative**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser'$(date +%s)'@test.com",
    "password": "Phase123!",
    "firstName": "Test",
    "lastName": "User"
  }' | jq .
```

---

### Scenario 2: Create Clients

**Steps**:
1. Log in with your test account
2. Navigate to "Clients" page
3. Click "Add Client" button
4. Fill in form:
   - Company ID: (auto-populated)
   - Client Name: `Acme Corporation`
   - Email: `contact@acme.com`
   - Phone: `+1-555-0001`
5. Click "Add Client"
6. Verify client appears in list

**Expected Result**:
```
✅ Client created successfully
Clients: 1
```

**cURL Alternative**:
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "your-company-id",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0001",
    "is_active": true
  }' | jq .
```

---

### Scenario 3: Create Accounts

**Steps**:
1. Navigate to "Accounts" page (if available)
2. Click "Add Account" button
3. Fill in form:
   - Company ID: (auto-populated)
   - Client: (select from dropdown)
   - Account Name: `Main Account`
   - Description: `Primary account for Acme`
4. Click "Add Account"
5. Verify account appears in list

**Expected Result**:
```
✅ Account created successfully
Accounts: 1
```

**cURL Alternative**:
```bash
curl -X POST http://localhost:3001/api/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "your-company-id",
    "client_id": "client-id-from-step-2",
    "name": "Main Account",
    "description": "Primary account"
  }' | jq .
```

---

### Scenario 4: Create Projects

**Steps**:
1. Navigate to "Projects" page
2. Click "Add Project" button
3. Fill in form:
   - Company ID: (auto-populated)
   - Account: (select from dropdown)
   - Project Name: `Website Redesign`
   - Start Date: `2025-01-01`
   - End Date: `2025-06-30`
   - Budget: `50000`
   - Status: `active`
4. Click "Add Project"
5. Verify project appears in list

**Expected Result**:
```
✅ Project created successfully
Projects: 1
```

**cURL Alternative**:
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "your-company-id",
    "account_id": "account-id-from-step-3",
    "name": "Website Redesign",
    "description": "Complete UI/UX overhaul",
    "start_date": "2025-01-01",
    "end_date": "2025-06-30",
    "budget": 50000,
    "status": "active"
  }' | jq .
```

---

### Scenario 5: Create Employees

**Steps**:
1. Navigate to "Employees" page
2. Click "Add Employee" button
3. Fill in form:
   - Company ID: (auto-populated)
   - First Name: `John`
   - Last Name: `Developer`
   - Email: `john.dev'$(date +%s)'@company.com`
   - Department: `Engineering`
   - Designation: `Senior Developer`
4. Click "Add Employee"
5. Verify employee appears in list

**Expected Result**:
```
✅ Employee created successfully
Employees: 1
Active Employees: 1
```

**cURL Alternative**:
```bash
curl -X POST http://localhost:3001/api/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "your-company-id",
    "first_name": "John",
    "last_name": "Developer",
    "email": "john.dev'$(date +%s)'@company.com",
    "department": "Engineering",
    "designation": "Senior Developer",
    "is_active": true
  }' | jq .
```

---

### Scenario 6: Keka Integration - Test Connection

**Steps**:
1. Open browser console (F12)
2. Run in console:
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3001/api/keka/sync/test', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(d => console.log(d));
```

**Expected Result**:
```json
{
  "success": false,
  "message": "❌ Keka API connection failed"
}
```
*(Expected 401 - our test credentials)*

**cURL Alternative**:
```bash
curl -X POST http://localhost:3001/api/keka/sync/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

### Scenario 7: Keka Integration - Sync All Data

**Steps**:
1. Open browser console
2. Run in console:
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3001/api/keka/sync/all', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(d => console.log(d));
```

**Expected Result**:
```json
{
  "success": true,
  "clients": { "success": false, "synced": 0, "failed": 0 },
  "projects": { "success": false, "synced": 0, "failed": 0 },
  "employees": { "success": false, "synced": 0, "failed": 0 },
  "duration": "0.45s",
  "message": "Keka sync complete"
}
```
*(Will show 401 errors for now - expected with test credentials)*

---

### Scenario 8: Dashboard KPI Data

**Steps**:
1. Navigate to "Dashboard" page
2. Verify KPI cards display:
   - Total Clients: Should show count from Scenario 2
   - Total Projects: Should show count from Scenario 4
   - Active Employees: Should show count from Scenario 5
   - Utilization Rate: Should show calculated rate

**Expected Result**:
```
✅ Dashboard loads real data
✅ KPI cards populated
✅ Charts display correctly
```

**cURL Alternative** - Get Dashboard Data:
```bash
# Get all clients
curl -s http://localhost:3001/api/clients \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# Get all projects
curl -s http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# Get active employees count
curl -s http://localhost:3001/api/employees/count/active \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

### Scenario 9: CRUD Update Operations

**Steps**:
1. Navigate to Clients page
2. Click Edit button on a client
3. Update fields:
   - Phone: `+1-555-0999`
4. Click "Update Client"
5. Verify success message

**Expected Result**:
```
✅ Client updated successfully
```

**cURL Alternative**:
```bash
curl -X PUT http://localhost:3001/api/clients/{client-id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "your-company-id",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0999",
    "is_active": true
  }' | jq .
```

---

### Scenario 10: CRUD Delete Operations

**Steps**:
1. Navigate to Employees page
2. Click Delete button on an employee
3. Confirm deletion
4. Verify employee removed from list

**Expected Result**:
```
✅ Employee deleted successfully
Employees: 0
```

**cURL Alternative**:
```bash
curl -X DELETE http://localhost:3001/api/employees/{employee-id} \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 🔍 Verification Checklist

### Backend Endpoints

```bash
TOKEN="your_jwt_token"

# ✅ Authentication
POST   /api/auth/register ................. ✓ Register user
POST   /api/auth/login ................... ✓ Login user
GET    /api/auth/me ..................... ✓ Get current user

# ✅ Clients CRUD
POST   /api/clients ..................... ✓ Create client
GET    /api/clients ..................... ✓ List clients
GET    /api/clients/:id ................. ✓ Get client
PUT    /api/clients/:id ................. ✓ Update client
DELETE /api/clients/:id ................. ✓ Delete client
GET    /api/clients/search .............. ✓ Search clients

# ✅ Accounts CRUD
POST   /api/accounts .................... ✓ Create account
GET    /api/accounts .................... ✓ List accounts
GET    /api/accounts/:id ................ ✓ Get account
PUT    /api/accounts/:id ................ ✓ Update account
DELETE /api/accounts/:id ................ ✓ Delete account

# ✅ Projects CRUD
POST   /api/projects .................... ✓ Create project
GET    /api/projects .................... ✓ List projects
GET    /api/projects/:id ................ ✓ Get project
PUT    /api/projects/:id ................ ✓ Update project
DELETE /api/projects/:id ................ ✓ Delete project
GET    /api/projects/active ............ ✓ Get active projects

# ✅ Employees CRUD
POST   /api/employees ................... ✓ Create employee
GET    /api/employees ................... ✓ List employees
GET    /api/employees/:id ............... ✓ Get employee
PUT    /api/employees/:id ............... ✓ Update employee
DELETE /api/employees/:id ............... ✓ Delete employee
GET    /api/employees/count/active ...... ✓ Get active count

# ✅ Keka Integration (6 new endpoints)
POST   /api/keka/sync/test .............. ✓ Test connection
POST   /api/keka/sync/clients .......... ✓ Sync clients
POST   /api/keka/sync/projects ........ ✓ Sync projects
POST   /api/keka/sync/employees ....... ✓ Sync employees
POST   /api/keka/sync/all ............. ✓ Sync all data
GET    /api/keka/sync/status .......... ✓ Get status
```

### Test All Endpoints

```bash
# Save token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@test.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }' | jq -r '.token')

echo "Token: $TOKEN"

# Test each endpoint
curl -s http://localhost:3001/api/health | jq .
curl -s http://localhost:3001/api/clients -H "Authorization: Bearer $TOKEN" | jq .
curl -s http://localhost:3001/api/projects -H "Authorization: Bearer $TOKEN" | jq .
curl -s http://localhost:3001/api/employees -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 🎯 Complete End-to-End Test

Run this script to test the complete workflow:

```bash
#!/bin/bash

API="http://localhost:3001/api"

echo "🧪 Phase 2 Complete Testing"
echo "===================================="

# 1. Register
echo -e "\n1️⃣  Registering user..."
USER=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2e-test-'$(date +%s)'@test.com",
    "password": "Test123!",
    "firstName": "E2E",
    "lastName": "Test"
  }')

TOKEN=$(echo $USER | jq -r '.token')
COMPANY=$(echo $USER | jq -r '.company_id')
echo "✅ Registered: $TOKEN"

# 2. Create Client
echo -e "\n2️⃣  Creating client..."
CLIENT=$(curl -s -X POST "$API/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\": \"$COMPANY\",
    \"name\": \"Test Client\",
    \"email\": \"client@test.com\",
    \"is_active\": true
  }")

CLIENT_ID=$(echo $CLIENT | jq -r '.id')
echo "✅ Client: $CLIENT_ID"

# 3. Create Account
echo -e "\n3️⃣  Creating account..."
ACCOUNT=$(curl -s -X POST "$API/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\": \"$COMPANY\",
    \"client_id\": \"$CLIENT_ID\",
    \"name\": \"Test Account\",
    \"description\": \"Test account\"
  }")

ACCOUNT_ID=$(echo $ACCOUNT | jq -r '.id')
echo "✅ Account: $ACCOUNT_ID"

# 4. Create Project
echo -e "\n4️⃣  Creating project..."
PROJECT=$(curl -s -X POST "$API/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\": \"$COMPANY\",
    \"account_id\": \"$ACCOUNT_ID\",
    \"name\": \"Test Project\",
    \"start_date\": \"2025-01-01\",
    \"end_date\": \"2025-12-31\",
    \"budget\": 100000,
    \"status\": \"active\"
  }")

PROJECT_ID=$(echo $PROJECT | jq -r '.id')
echo "✅ Project: $PROJECT_ID"

# 5. Create Employee
echo -e "\n5️⃣  Creating employee..."
EMPLOYEE=$(curl -s -X POST "$API/employees" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\": \"$COMPANY\",
    \"first_name\": \"Test\",
    \"last_name\": \"Employee\",
    \"email\": \"emp-$(date +%s)@test.com\",
    \"department\": \"Engineering\",
    \"designation\": \"Developer\",
    \"is_active\": true
  }")

EMPLOYEE_ID=$(echo $EMPLOYEE | jq -r '.id')
echo "✅ Employee: $EMPLOYEE_ID"

# 6. Test Keka Endpoints
echo -e "\n6️⃣  Testing Keka endpoints..."
curl -s -X POST "$API/keka/sync/test" \
  -H "Authorization: Bearer $TOKEN" | jq '.message'

echo -e "\n7️⃣  Testing full CRUD operations..."
curl -s -X GET "$API/clients" \
  -H "Authorization: Bearer $TOKEN" | jq '.total' | xargs echo "Total clients:"

curl -s -X GET "$API/projects" \
  -H "Authorization: Bearer $TOKEN" | jq '.total' | xargs echo "Total projects:"

curl -s -X GET "$API/employees" \
  -H "Authorization: Bearer $TOKEN" | jq '.total' | xargs echo "Total employees:"

echo -e "\n✅ Complete E2E test finished!"
```

---

## 📊 Expected Results Summary

| Test | Status | Result |
|------|--------|--------|
| User Registration | ✅ | JWT token generated |
| User Login | ✅ | User authenticated |
| Client Creation | ✅ | Client stored in DB |
| Account Creation | ✅ | Account linked to client |
| Project Creation | ✅ | Project linked to account |
| Employee Creation | ✅ | Employee added to company |
| Dashboard KPIs | ✅ | Real data displayed |
| Keka Test | ⚠️ | 401 error (expected) |
| Keka Sync | ⚠️ | 401 error (expected) |
| CRUD Updates | ✅ | Records updated |
| CRUD Deletes | ✅ | Records deleted |

---

## 🐛 Troubleshooting

### Backend Not Responding

```bash
# Check if running
curl -s http://localhost:3001/api/health

# Check logs
tail -50 /tmp/backend.log

# Restart
pkill -9 node
cd backend && npm run dev &
```

### Frontend Not Loading

```bash
# Check if running
curl -s http://localhost:8080 | head -20

# Check logs
cat /tmp/frontend.log

# Restart on different port
pkill -9 python3
cd frontend-static && python3 -m http.server 8080 &
```

### JWT Token Issues

- Verify token is in localStorage: `localStorage.getItem('token')`
- Check token format: `Authorization: Bearer {token}`
- Verify token not expired (24 hour expiration)

### Database Connection Issues

```bash
# Verify PostgreSQL running
docker ps | grep portfolio-db

# Check database
psql -U portfolio_user -d portfolio_management -c "SELECT COUNT(*) FROM clients;"
```

---

## 🔗 Quick Links

- Backend API: http://localhost:3001/api
- Frontend: http://localhost:8080/index.html
- Health Check: http://localhost:3001/api/health
- API Documentation: See KEKA_INTEGRATION_GUIDE.md

---

## ✨ Notes

- All tests use JWT authentication
- All data is scoped by company_id
- Keka sync endpoints return 401 (test credentials)
- Timestamps are UTC
- Use `jq` for nice JSON formatting

---

**Ready to Test?** Start with Scenario 1 and work through each scenario sequentially.

