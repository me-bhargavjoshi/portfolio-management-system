# Quick Start Guide - Phase 2 Complete

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 16 running (Docker)
- Ports 3000, 3001 available

### Start All Services

```bash
cd "/Users/detadmin/Documents/Portfolio Management"

# 1. Start database (if using Docker)
docker-compose up -d

# 2. Terminal 1 - Start Backend
cd backend
npm install  # First time only
npm run dev

# 3. Terminal 2 - Start Frontend
cd ../frontend-static
python3 -m http.server 3000
```

### Access the Application
- Frontend: http://localhost:3000/index.html
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

---

## 📝 Quick Test

```bash
# Run comprehensive integration test
bash test-api-integration.sh
```

Expected output: ✅ All 8 tests passing

---

## 🔐 Default Test User

After running the test, you can use any registered account:
- Frontend login: http://localhost:3000/login.html
- Registration form available on login page
- Password requirement: At least 1 uppercase, 1 number, 1 special char

---

## 📊 API Examples

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Test123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Create Client
```bash
TOKEN="your_jwt_token_here"
COMPANY_ID="your_company_id"

curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "company_id": "'$COMPANY_ID'",
    "name": "Acme Corporation",
    "email": "info@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St",
    "city": "New York"
  }'
```

### Create Account (for projects)
```bash
CLIENT_ID="client_id_from_above"

curl -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "company_id": "'$COMPANY_ID'",
    "client_id": "'$CLIENT_ID'",
    "name": "Acme - Project Account",
    "description": "Main account for Acme projects"
  }'
```

### Create Project
```bash
ACCOUNT_ID="account_id_from_above"

curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "company_id": "'$COMPANY_ID'",
    "account_id": "'$ACCOUNT_ID'",
    "name": "Website Redesign",
    "description": "Complete UI/UX overhaul",
    "start_date": "2025-01-15",
    "end_date": "2025-03-15",
    "budget": 50000
  }'
```

### Create Employee
```bash
curl -X POST http://localhost:3001/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "company_id": "'$COMPANY_ID'",
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@company.com",
    "department": "Engineering",
    "designation": "Senior Developer"
  }'
```

### List Clients
```bash
curl -X GET "http://localhost:3001/api/clients?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🗄️ Database Schema Quick Reference

### Core Relationships
```
Company (1) ← (N) Users
Company (1) ← (N) Clients
Company (1) ← (N) Employees
Company (1) ← (N) Projects

Client (1) ← (N) Accounts
Account (1) ← (N) Projects
```

### Key Tables
- `users` - User accounts
- `companies` - User's organizations
- `clients` - Client companies
- `accounts` - Client account subdivisions
- `projects` - Projects linked to accounts
- `employees` - Company employees

---

## 🔍 Debugging

### Check Backend Logs
```bash
tail -f /tmp/backend.log
```

### Check Database Connection
```bash
# Inside PostgreSQL container
docker exec -it portfolio-db psql -U portfolio_user -d portfolio_management -c "SELECT COUNT(*) FROM users;"
```

### Test Database Directly
```bash
# List all tables
docker exec -it portfolio-db psql -U portfolio_user -d portfolio_management -c "\dt"

# Check users table
docker exec -it portfolio-db psql -U portfolio_user -d portfolio_management -c "SELECT id, email FROM users LIMIT 5;"
```

### Frontend Issues
1. Open browser DevTools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab to see API calls
4. Verify Authorization header in requests

---

## 📋 Common Tasks

### Reset Database
```bash
docker-compose down
docker volume rm portfolio-management_postgres_data  # if needed
docker-compose up -d
```

### Rebuild Backend
```bash
cd backend
npm run build
npm run dev
```

### Update Frontend Code
1. Edit `frontend-static/index.html`
2. Refresh browser (Cmd+R)
3. No rebuild needed

### Deploy Backend Change
1. Make code changes
2. Run: `npm run build`
3. Restart backend: `npm run dev`
4. Test with integration script

---

## 📊 What's Working

✅ User registration and login
✅ JWT authentication
✅ Client CRUD (Create, Read, Update, Delete)
✅ Account management
✅ Project CRUD
✅ Employee CRUD
✅ Real-time dashboard KPIs
✅ Data persistence in PostgreSQL
✅ API error handling
✅ Frontend form validation

---

## ⏭️ Next Phase

**Phase 3: Effort Tracking**
- Projected efforts interface
- Estimated efforts system
- Actual efforts tracking
- Capacity planning

---

## 📞 Support

For issues or questions:
1. Check PHASE2_FRONTEND_INTEGRATION_COMPLETE.md for detailed docs
2. Review README.md for architecture overview
3. Check test results: `bash test-api-integration.sh`
4. Review database schema: `database/init.sql`

---

Last Updated: 2025-11-13
Status: ✅ Production Ready
