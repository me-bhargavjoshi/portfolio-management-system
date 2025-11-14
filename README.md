# Portfolio Management Tool - IT Delivery

A comprehensive portfolio management system for IT Delivery managers and PMOs to track and analyze resource allocation across projects, accounts, clients, and the organization.

## 🎯 Overview

This tool enables IT delivery teams to:
- **Track effort allocation** across Projected vs Estimated vs Actual hours
- **Manage resources** at employee, project, account, and company levels
- **Analyze variances** between planning and execution
- **Plan capacity** and identify bottlenecks
- **Generate insights** through interactive dashboards and reports
- **Integrate** with existing timesheet systems (KEKA, BambooHR, Jira)

## 🏗️ Architecture

### Monorepo Structure
```
portfolio-management/
├── backend/              # Node.js/Express API (TypeScript)
├── frontend/             # React SPA (TypeScript)
├── database/             # PostgreSQL schema & migrations
├── docker-compose.yml    # Multi-service orchestration
├── .github/
│   └── workflows/        # CI/CD pipelines
└── docs/                 # Documentation
```

### Technology Stack

**Backend:**
- Node.js 20 + Express.js
- TypeScript 5+
- PostgreSQL 15 (database)
- Redis 7 (caching)
- JWT authentication
- Row-Level Security for multi-tenancy

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Router (navigation)
- Tailwind CSS (styling)
- Zustand (state management)
- Recharts (visualizations)
- React Big Calendar (Gantt charts)

**Infrastructure:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Services with Docker**
   ```bash
   npm run docker:up
   ```
   
   This starts:
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - Backend API (port 3001)
   - Frontend (port 3000)

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - Health Check: http://localhost:3001/api/health

4. **Database Setup** (auto-runs in Docker)
   - Schema migration via `database/init.sql`
   - Default credentials in `docker-compose.yml`

### Local Development (Without Docker)

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Database
# Start PostgreSQL locally or use Docker
docker run -d -p 5432:5432 -e POSTGRES_DB=portfolio_management \
  -e POSTGRES_USER=portfolio_user -e POSTGRES_PASSWORD=portfolio_password postgres:15

# Terminal 4: Redis
docker run -d -p 6379:6379 redis:7
```

## 📦 Project Dependencies

### Backend
- **express**: Web framework
- **pg**: PostgreSQL driver
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **redis**: Caching layer
- **joi**: Input validation
- **multer**: File uploads
- **axios**: HTTP client
- **helmet**: Security headers
- **cors**: Cross-origin support

### Frontend
- **react-router-dom**: Routing
- **zustand**: State management
- **recharts**: Data visualization
- **react-big-calendar**: Calendar/Gantt
- **react-table**: Data tables
- **tailwindcss**: Styling
- **shadcn-ui**: Component library

## 🗄️ Database Schema

The schema includes 25+ tables organized by feature:

### Tenant & Company (Multi-tenancy)
- `companies`: Company profiles
- `company_settings`: Company configurations
- `user_roles`: Role definitions with permissions

### Users & Authentication
- `users`: User accounts with JWT support
- Encrypted passwords with bcryptjs

### Client-Account-Project Hierarchy
- `clients`: Client master data
- `accounts`: Accounts under clients
- `projects`: Projects under accounts

### Resources & Skills
- `employees`: Employee master data with KEKA sync
- `employee_skills`: Skills matrix and proficiency

### Effort Tracking (3-layer model)
- `projected_efforts`: Planned allocation (weekly)
- `estimated_efforts`: Task-level estimates
- `actual_efforts`: Real-time from timesheets

### Aggregations (for performance)
- `effort_aggregations_daily`: Daily rollups
- `effort_aggregations_weekly`: Weekly rollups
- `effort_aggregations_monthly`: Monthly rollups

### Audit & Compliance
- `audit_logs`: Complete change history
- `integrations`: External system credentials
- `integration_sync_logs`: Sync audit trail

### Indexes & Materialized Views
- Optimized query performance
- `employee_utilization_monthly`: Pre-computed analytics
- `project_effort_summary`: Project-level metrics

## 🔐 Security Features

- **Row-Level Security (RLS)**: Database-level tenant isolation
- **JWT Authentication**: Stateless API security
- **Role-Based Access Control (RBAC)**: Granular permissions
- **Encrypted Secrets**: API keys and credentials
- **Audit Logging**: Complete change history
- **GDPR Compliance**: Data export and right to deletion
- **SOX Controls**: Segregation of duties

## 📊 Key Features (To Be Implemented)

### 1. **Analytics Dashboard** ✓ (Scaffolded)
- KPI summaries and trends
- Variance analysis (Projected vs Estimated vs Actual)
- Resource utilization heatmaps
- Project health indicators
- Customizable widgets

### 2. **Master Data Management** (In Progress)
- Client/Account/Project hierarchy with CRUD
- Employee directory with skills
- Bulk import/export (CSV, Excel)
- Duplicate detection and merge
- Change history tracking

### 3. **Effort Planning** (In Progress)
- Projected efforts with drag-drop allocation
- Capacity planning views
- Scenario planning (what-if)
- Conflict detection for over-allocation

### 4. **Actual Efforts Integration** (Planned)
- KEKA API adapter for timesheet sync
- BambooHR and Jira support
- Real-time data synchronization
- Configurable polling intervals

### 5. **Advanced Reporting** (Planned)
- Custom report builder
- Pre-built templates
- Scheduled delivery
- Export (PDF, Excel, CSV)
- Email integration

### 6. **Visualizations** (Planned)
- Interactive Gantt charts
- Resource allocation timelines
- Heatmaps and trend analysis
- Waterfall and funnel charts
- Skill matrices

## 🔄 API Endpoints (Basic)

```
# Health Check
GET /api/health

# Authentication
POST /api/auth/login
POST /api/auth/register

# Protected Routes (require JWT)
GET /api/dashboard
GET /api/projects
GET /api/employees
GET /api/efforts
GET /api/reports
```

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio_management
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# KEKA Integration
KEKA_API_KEY=your-keka-api-key
KEKA_API_URL=https://api.keka.com

# Optional: Other integrations
BAMBOOHR_API_KEY=
JIRA_API_URL=
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001/api
```

## 🧪 Testing

```bash
# Backend tests
npm run test --workspace=backend
npm run test:coverage --workspace=backend

# Frontend tests
npm run test --workspace=frontend

# All tests
npm test
```

## 📦 Building for Production

```bash
# Build all services
npm run build

# Build with Docker
npm run docker:build

# Deploy
npm run docker:up
```

## 🤝 KEKA Integration

### Setup Steps
1. Get KEKA API credentials
2. Add to environment: `KEKA_API_KEY`
3. Configure sync interval (default: 60 minutes)
4. Available endpoints:
   - Generate Access Token
   - Get all Employees
   - Get all Clients
   - Get all Projects
   - Get Project Resources
   - Get Project Timesheet Entries

### Adapter Pattern
- Extensible interface for multiple timesheet providers
- Abstracted under `src/integrations/`
- Pluggable adapters for KEKA, BambooHR, Jira

## 📚 Documentation

- **API Documentation**: `docs/api.md` (to be created)
- **Database Schema**: `docs/database.md` (to be created)
- **User Guide**: `docs/user-guide.md` (to be created)
- **Admin Guide**: `docs/admin-guide.md` (to be created)
- **Developer Guide**: `docs/dev-guide.md` (to be created)

## 🗺️ Roadmap

### Phase 1 (Current)
- ✓ Project scaffolding
- [ ] Database schema finalization
- [ ] Core backend API
- [ ] Basic frontend pages

### Phase 2
- [ ] Master Data CRUD modules
- [ ] Projected/Estimated efforts
- [ ] Authentication system
- [ ] Dashboard implementation

### Phase 3
- [ ] KEKA integration
- [ ] Actual efforts sync
- [ ] Analytics engine
- [ ] Reporting system

### Phase 4
- [ ] Advanced visualizations
- [ ] Gantt charts
- [ ] ML-based forecasting
- [ ] Multi-language support

### Phase 5+
- [ ] Mobile app
- [ ] Real-time collaboration
- [ ] Advanced BI features
- [ ] Blockchain audit trail

## 🤝 Contributing

1. Create a feature branch
2. Follow TypeScript/ESLint standards
3. Write tests for new features
4. Submit PR with description

## 📄 License

To be determined

## 🆘 Support

For issues and questions, please create an issue in the repository.

---

**Last Updated**: November 13, 2025
**Status**: Active Development
