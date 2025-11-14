# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PORTFOLIO MANAGEMENT                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  React SPA (TypeScript)                                         │ │
│  │  - Login/Auth Pages                                             │ │
│  │  - Dashboard (KPIs, Analytics)                                  │ │
│  │  - Master Data (Clients, Accounts, Projects, Employees)        │ │
│  │  - Effort Planning (Projected, Estimated, Actual)             │ │
│  │  - Reports & Analytics                                         │ │
│  │  - Visualizations (Gantt, Heatmaps, Charts)                    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                                  ↕
                            (HTTPS/REST API)
                                  ↕
┌──────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY & AUTHENTICATION                       │
│  - JWT Token Validation                                              │
│  - Role-Based Access Control (RBAC)                                  │
│  - Request/Response Logging                                          │
└──────────────────────────────────────────────────────────────────────┘
                                  ↕
┌──────────────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (Express.js API Server)               │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ CONTROLLERS & ROUTES                                            │ │
│  │ - Auth Controller         - Project Controller                 │ │
│  │ - Company Controller      - Employee Controller                │ │
│  │ - Client Controller       - Effort Controller                  │ │
│  │ - Account Controller      - Report Controller                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                  ↓                                    │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ SERVICE LAYER (Business Logic)                                  │ │
│  │ - AuthService             - ProjectService                      │ │
│  │ - CompanyService          - EmployeeService                     │ │
│  │ - ClientService           - EffortService                       │ │
│  │ - AccountService          - ReportService                       │ │
│  │                           - AnalyticsService                    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                  ↓                                    │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ DATA ACCESS LAYER                                               │ │
│  │ - Query Builders          - Transaction Management              │ │
│  │ - Connection Pooling      - Prepared Statements                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                          ↓              ↓              ↓
         ┌─────────────────┴──────────┬──┴────────┐────┴──────────┐
         ↓                            ↓           ↓                ↓
    ┌─────────┐              ┌─────────────┐  ┌──────┐         ┌──────────┐
    │PostgreSQL              │Redis Cache  │  │KEKA  │         │BambooHR  │
    │Database               │(Session,    │  │API   │         │Jira      │
    │                        │Aggregations)│  │      │         │APIs      │
    │25+ Tables              └─────────────┘  └──────┘         └──────────┘
    │Row-Level Security                           ↓                ↓
    │Materialized Views        (Real-time sync)  (Adapter)    (Adapter)
    │Indexes & Triggers
    │Audit Logs
    └─────────────┘
```

## Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────────┐
│  Multiple Companies (Tenants)                       │
├─────────────────────────────────────────────────────┤
│ Company A │ Company B │ Company C │ Company D       │
└─────────────────────────────────────────────────────┘
        ↓         ↓         ↓         ↓
┌─────────────────────────────────────────────────────┐
│  Single PostgreSQL Database (Row-Level Security)    │
├─────────────────────────────────────────────────────┤
│ - company_id column on all tables                   │
│ - RLS policies for tenant isolation                 │
│ - Segregated user sessions per tenant               │
└─────────────────────────────────────────────────────┘
```

## Data Flow: Effort Tracking

```
┌────────────────────────────────────────────────────────────────┐
│                   THREE-LAYER EFFORT MODEL                     │
└────────────────────────────────────────────────────────────────┘

LAYER 1: PROJECTED EFFORTS
  Input: Manual/Import
  Frequency: Weekly
  Granularity: Employee → Project → Week
  └─→ Table: projected_efforts

         ↓ (Planning)

LAYER 2: ESTIMATED EFFORTS
  Input: Manual/Formula
  Frequency: As needed
  Granularity: Task → Employee → Project
  └─→ Table: estimated_efforts

         ↓ (Execution)

LAYER 3: ACTUAL EFFORTS
  Input: Timesheet systems (KEKA, BambooHR)
  Frequency: Daily
  Granularity: Employee → Project → Date
  └─→ Table: actual_efforts

         ↓ (Aggregation)

AGGREGATION TABLES (Pre-computed for Performance)
  - effort_aggregations_daily (per employee/project)
  - effort_aggregations_weekly (per employee/project)
  - effort_aggregations_monthly (per employee/project/company)

         ↓ (Analysis)

ANALYTICS & DASHBOARDS
  - Variance Analysis (Projected vs Estimated vs Actual)
  - Utilization Metrics
  - Resource Planning
  - Forecasting
```

## Integration Architecture (Adapter Pattern)

```
┌──────────────────────────────────┐
│  Integration Engine              │
│  (Sync Scheduler, Error Handling)│
└──────────────────────────────────┘
                ↓
        ┌───────┴────────┐
        ↓                ↓
    ┌────────────┐   ┌────────────┐
    │KEKA Adapter│   │BambooHR    │
    │            │   │Adapter     │
    │- Employees │   │- Employees │
    │- Projects  │   │- Timesheets│
    │- Timesheets│   └────────────┘
    └────────────┘
        ↓
    ┌─────────────────────────────────┐
    │ Database (normalized format)     │
    │ - employees table               │
    │ - actual_efforts table          │
    │ - integration_sync_logs         │
    └─────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────┐
│  Application Security               │
│  ├─ JWT Authentication              │
│  ├─ Role-Based Access Control       │
│  ├─ Input Validation (Joi)          │
│  └─ Rate Limiting                   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Database Security                  │
│  ├─ Row-Level Security (RLS)        │
│  ├─ Field-Level Encryption          │
│  ├─ Prepared Statements             │
│  └─ Connection Pooling              │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Audit & Compliance                 │
│  ├─ Audit Logs (all changes)        │
│  ├─ User Activity Tracking          │
│  ├─ GDPR Compliance                 │
│  └─ SOX Controls                    │
└─────────────────────────────────────┘
```

## Performance Optimization Strategy

```
CLIENT SIDE
├─ Lazy Loading
├─ Virtual Scrolling
├─ Code Splitting
└─ Service Workers

API LAYER
├─ Pagination
├─ Response Compression
├─ Caching Headers
└─ Query Optimization

CACHING LAYER (Redis)
├─ Session Cache
├─ Query Results
├─ Aggregations
└─ Real-time Updates

DATABASE LAYER
├─ Indexes (25+)
├─ Materialized Views
├─ Connection Pooling
├─ Query Optimization
└─ Partitioning (for large tables)
```

## Scalability Considerations

```
HORIZONTAL SCALING
├─ Multiple API server instances
├─ Load Balancer (Nginx/HAProxy)
├─ Sticky Sessions (JWT-based)
└─ Stateless Design

VERTICAL SCALING
├─ Database: More CPU/Memory
├─ Redis: Bigger cache pool
├─ Application: Resource limits
└─ Storage: SSD optimization

DISTRIBUTED ARCHITECTURE
├─ Microservices (future)
├─ Message Queue (RabbitMQ/Kafka)
├─ Event Streaming
└─ Real-time Sync
```

---

**Architecture Version**: 1.0
**Last Updated**: November 13, 2025
