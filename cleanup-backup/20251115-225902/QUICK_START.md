# Quick Reference Guide - Portfolio Management Tool

## 🚀 Fastest Way to Get Started (5 Minutes)

```bash
# 1. Navigate to project
cd "/Users/detadmin/Documents/Portfolio Management"

# 2. Make setup script executable and run it
chmod +x setup.sh
./setup.sh

# 3. Wait for "Setup Complete!" message
# 4. In a new terminal, start the backend
npm run dev --workspace=backend

# 5. In another terminal, start the frontend
npm run dev --workspace=frontend

# 6. Open browser
open http://localhost:3000
```

---

## 🔗 URLs After Startup

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web application |
| Backend API | http://localhost:3001/api | REST API |
| Health Check | http://localhost:3001/api/health | API status |
| Database | postgresql://portfolio_user@localhost:5432/portfolio_management | PostgreSQL |
| Redis | redis://localhost:6379 | Cache/Session |

---

## 🗂️ Key Files

| File | Purpose |
|------|---------|
| README.md | Project overview & features |
| SETUP_SUMMARY.md | Setup instructions & next steps |
| FILE_INDEX.md | Complete file structure |
| docs/ARCHITECTURE.md | System design & architecture |
| database/init.sql | Database schema (25+ tables) |
| docker-compose.yml | Service orchestration |
| backend/src/index.ts | Backend entry point |
| frontend/src/App.tsx | Frontend entry point |
| backend/.env.example | Backend configuration template |
| frontend/.env.example | Frontend configuration template |

---

## 📦 Essential Commands

### Setup & Installation
```bash
npm install                          # Install all dependencies
npm run docker:up                    # Start all Docker services
npm run docker:down                  # Stop all Docker services
./cleanup.sh                         # Remove containers and node_modules
```

### Development
```bash
npm run dev --workspace=backend      # Start backend (port 3001)
npm run dev --workspace=frontend     # Start frontend (port 3000)
npm run lint                         # Check code quality
npm run format                       # Auto-format code
```

### Database
```bash
# Connect to database
docker exec -it portfolio-db psql -U portfolio_user -d portfolio_management

# Run SQL query
docker exec portfolio-db psql -U portfolio_user -d portfolio_management -c "SELECT * FROM companies;"

# View all tables
docker exec -it portfolio-db psql -U portfolio_user -d portfolio_management -c "\dt"
```

### Docker
```bash
docker-compose ps                    # View running services
docker-compose logs -f [service]     # View logs
docker-compose restart [service]     # Restart service
docker exec -it [container] bash     # Enter container shell
```

### Testing & Quality
```bash
npm test                             # Run all tests
npm run test:coverage                # Coverage report
npm run lint                         # ESLint check
npm run format                       # Prettier format
```

### Production Build
```bash
npm run build                        # Build all services
npm run docker:build                 # Build Docker images
```

---

## 🔐 Default Credentials

### Database
- **User**: portfolio_user
- **Password**: portfolio_password
- **Database**: portfolio_management
- **Host**: localhost:5432

### Redis
- **URL**: redis://localhost:6379
- **No authentication** (default)

### Application
- **Demo User**: Use any email/password
- **Login Page**: http://localhost:3000
- **Onboarding**: To be implemented

---

## 📊 Database Quick Info

### Main Tables
- `companies` - Company profiles
- `users` - User accounts
- `employees` - Employee data
- `projects` - Project definitions
- `clients` - Client master data
- `accounts` - Accounts under clients
- `projected_efforts` - Planned allocation
- `estimated_efforts` - Task estimates
- `actual_efforts` - Real hours worked

### Features
- 25+ tables
- 25+ indexes for performance
- Row-Level Security (RLS)
- Materialized views
- Audit logging
- 100k+ employee capacity

---

## 🛠️ Technology Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Backend Runtime | Node.js 20+ |
| Backend Framework | Express.js 4+ |
| Language | TypeScript 5+ |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Frontend | React 18+ |
| Build Tool | Vite 5+ |
| Styling | Tailwind CSS 3+ |
| State Mgmt | Zustand 4+ |
| Container | Docker + Docker Compose |

---

## 🎯 Development Roadmap

### Phase 1 (Week 1-2): Backend Foundation
- [ ] Install dependencies
- [ ] Implement authentication
- [ ] Create core controllers
- [ ] Build service layer
- [ ] Test database queries

### Phase 2 (Week 2-3): Master Data
- [ ] Client CRUD
- [ ] Account management
- [ ] Project management
- [ ] Employee management
- [ ] Bulk import/export

### Phase 3 (Week 3-4): Effort Tracking
- [ ] Projected efforts
- [ ] Estimated efforts
- [ ] Actual efforts aggregation
- [ ] Capacity planning
- [ ] Conflict detection

### Phase 4 (Week 4+): Integration & Analytics
- [ ] KEKA integration
- [ ] Analytics dashboard
- [ ] Reporting engine
- [ ] Advanced visualizations
- [ ] CI/CD pipeline

---

## 🔍 File Locations

### Configuration Files
- `backend/.env.example` - Backend template
- `frontend/.env.example` - Frontend template
- `.eslintrc.json` - Linting rules
- `.prettierrc` - Code formatting
- `tsconfig.json` - TypeScript config

### Source Code
- Backend: `backend/src/`
- Frontend: `frontend/src/`
- Database: `database/init.sql`

### Documentation
- Main: `README.md`
- Setup: `SETUP_SUMMARY.md`
- Index: `FILE_INDEX.md`
- Architecture: `docs/ARCHITECTURE.md`

---

## ⚠️ Troubleshooting

### Services Won't Start
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :3001
lsof -i :5432
lsof -i :6379

# Kill process if needed
kill -9 [PID]
```

### Database Connection Failed
```bash
# Restart database container
docker-compose restart postgres

# Check database logs
docker-compose logs postgres

# Verify connection
docker exec -it portfolio-db pg_isready
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

### Port Already in Use
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3002 npm run dev --workspace=backend
```

---

## 📞 Help & Resources

1. **README.md** - Full project overview
2. **SETUP_SUMMARY.md** - Detailed setup guide
3. **FILE_INDEX.md** - Complete file structure
4. **docs/ARCHITECTURE.md** - System architecture
5. **docs/DATABASE.md** - Database documentation (to be created)
6. **Docker Logs** - `docker-compose logs [service]`
7. **Database Logs** - `docker exec portfolio-db tail -f /var/log/postgresql.log`

---

## 🎓 Project Structure at a Glance

```
Portfolio Management/
├── backend/              (Node.js/Express API)
├── frontend/             (React SPA)
├── database/             (PostgreSQL Schema)
├── docs/                 (Documentation)
├── .github/              (CI/CD Workflows)
├── docker-compose.yml    (Multi-service setup)
├── package.json          (Monorepo root)
├── README.md             (Main docs)
├── SETUP_SUMMARY.md      (Setup guide)
└── FILE_INDEX.md         (This file structure)
```

---

## ✅ Checklist Before You Start

- [ ] Read README.md
- [ ] Read SETUP_SUMMARY.md
- [ ] Node.js 20+ installed
- [ ] Docker installed
- [ ] Git configured
- [ ] 10GB free disk space
- [ ] Ports 3000, 3001, 5432, 6379 available

---

## 🚀 Right Now, Do This

1. Open terminal
2. Run: `cd "/Users/detadmin/Documents/Portfolio Management"`
3. Run: `chmod +x setup.sh && ./setup.sh`
4. Wait 5-10 seconds for setup to complete
5. In new terminal: `npm run dev --workspace=backend`
6. In another terminal: `npm run dev --workspace=frontend`
7. Open: `http://localhost:3000`

That's it! You're up and running! 🎉

---

## 📈 What's Already Built

✅ Database schema (25+ tables)
✅ Express server setup
✅ React app with routing
✅ Docker orchestration
✅ Authentication middleware
✅ Type definitions
✅ Dashboard UI (basic)
✅ Navigation component
✅ Login page
✅ Configuration management

## 🚧 What You'll Build Next

🔄 Authentication implementation
🔄 CRUD operations for master data
🔄 Effort tracking system
🔄 KEKA integration
🔄 Analytics dashboard
🔄 Reporting engine
🔄 Advanced visualizations
🔄 CI/CD pipeline

---

**Updated**: November 13, 2025
**Version**: 1.0
**Status**: ✅ Ready to Use
