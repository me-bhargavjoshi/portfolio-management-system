-- Portfolio Management Database Schema
-- Multi-tenant support with Row-Level Security

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TENANT & COMPANY MANAGEMENT
-- ============================================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  fiscal_year_start_month INTEGER DEFAULT 1,
  standard_work_hours_per_day DECIMAL(5, 2) DEFAULT 8.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  work_days_per_week INTEGER DEFAULT 5,
  annual_holidays INTEGER DEFAULT 20,
  fiscal_year_start_month INTEGER DEFAULT 1,
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USER & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, email)
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, name)
);

-- ============================================================================
-- CLIENT-ACCOUNT-PROJECT HIERARCHY
-- ============================================================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keka_id VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_clients_keka_id ON clients(keka_id);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keka_client_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  account_manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_accounts_keka_client_id ON accounts(keka_client_id);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  keka_id VARCHAR(100) UNIQUE,
  keka_client_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, on_hold, cancelled
  budget DECIMAL(15, 2),
  estimated_hours DECIMAL(10, 2),
  project_manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================================================
-- EMPLOYEE & SKILLS
-- ============================================================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keka_employee_id VARCHAR(100),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  designation VARCHAR(100),
  reporting_manager_id UUID REFERENCES employees(id),
  billable_rate DECIMAL(10, 2),
  cost_per_hour DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(company_id, keka_employee_id),
  UNIQUE(company_id, email)
);

CREATE TABLE employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(50), -- beginner, intermediate, advanced, expert
  years_of_experience DECIMAL(3, 1),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EFFORT TRACKING: PROJECTED, ESTIMATED, ACTUAL
-- ============================================================================

CREATE TABLE projected_efforts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  monday_hours DECIMAL(5, 2) DEFAULT 0,
  tuesday_hours DECIMAL(5, 2) DEFAULT 0,
  wednesday_hours DECIMAL(5, 2) DEFAULT 0,
  thursday_hours DECIMAL(5, 2) DEFAULT 0,
  friday_hours DECIMAL(5, 2) DEFAULT 0,
  total_hours DECIMAL(6, 2) GENERATED ALWAYS AS (
    monday_hours + tuesday_hours + wednesday_hours + thursday_hours + friday_hours
  ) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(company_id, project_id, employee_id, week_of)
);

CREATE TABLE estimated_efforts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  task_description TEXT,
  estimated_hours DECIMAL(10, 2) NOT NULL,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, on_hold
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE TABLE actual_efforts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effort_date DATE NOT NULL,
  hours_worked DECIMAL(6, 2) NOT NULL,
  task_description TEXT,
  source VARCHAR(50) DEFAULT 'manual', -- manual, keka, bamboohr, jira
  external_timesheet_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, employee_id, effort_date, source, external_timesheet_id)
);

-- ============================================================================
-- AGGREGATION TABLES FOR PERFORMANCE
-- ============================================================================

CREATE TABLE effort_aggregations_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  effort_date DATE NOT NULL,
  projected_hours DECIMAL(10, 2) DEFAULT 0,
  estimated_hours DECIMAL(10, 2) DEFAULT 0,
  actual_hours DECIMAL(10, 2) DEFAULT 0,
  variance_hours DECIMAL(10, 2) GENERATED ALWAYS AS (actual_hours - estimated_hours) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, project_id, employee_id, effort_date)
);

CREATE TABLE effort_aggregations_weekly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  week_starting DATE NOT NULL,
  projected_hours DECIMAL(10, 2) DEFAULT 0,
  estimated_hours DECIMAL(10, 2) DEFAULT 0,
  actual_hours DECIMAL(10, 2) DEFAULT 0,
  variance_hours DECIMAL(10, 2) GENERATED ALWAYS AS (actual_hours - estimated_hours) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_effort_agg_weekly_unique 
ON effort_aggregations_weekly (company_id, week_starting, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'), COALESCE(employee_id, '00000000-0000-0000-0000-000000000000'));

CREATE TABLE effort_aggregations_monthly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  projected_hours DECIMAL(10, 2) DEFAULT 0,
  estimated_hours DECIMAL(10, 2) DEFAULT 0,
  actual_hours DECIMAL(10, 2) DEFAULT 0,
  variance_hours DECIMAL(10, 2) GENERATED ALWAYS AS (actual_hours - estimated_hours) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_effort_agg_monthly_unique 
ON effort_aggregations_monthly (company_id, month_start, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'), COALESCE(employee_id, '00000000-0000-0000-0000-000000000000'));

-- ============================================================================
-- AUDIT & COMPLIANCE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- create, update, delete, view
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EXTERNAL INTEGRATIONS
-- ============================================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_type VARCHAR(100) NOT NULL, -- keka, bamboohr, jira, etc.
  api_key VARCHAR(500),
  api_secret VARCHAR(500),
  api_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  sync_interval_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, integration_type)
);

CREATE TABLE integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  sync_type VARCHAR(100), -- employees, timesheets, projects
  records_synced INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_keka_id ON employees(keka_employee_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_account_id ON projects(account_id);
CREATE INDEX idx_projected_efforts_project ON projected_efforts(company_id, project_id);
CREATE INDEX idx_projected_efforts_employee ON projected_efforts(company_id, employee_id);
CREATE INDEX idx_projected_efforts_week ON projected_efforts(week_of);
CREATE INDEX idx_estimated_efforts_project ON estimated_efforts(company_id, project_id);
CREATE INDEX idx_estimated_efforts_employee ON estimated_efforts(company_id, employee_id);
CREATE INDEX idx_actual_efforts_project ON actual_efforts(company_id, project_id);
CREATE INDEX idx_actual_efforts_employee ON actual_efforts(company_id, employee_id);
CREATE INDEX idx_actual_efforts_date ON actual_efforts(effort_date);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (Multi-tenancy)
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projected_efforts ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimated_efforts ENABLE ROW LEVEL SECURITY;
ALTER TABLE actual_efforts ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies here (to be customized per application needs)

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

CREATE MATERIALIZED VIEW employee_utilization_monthly AS
SELECT
  ae.company_id,
  ae.employee_id,
  e.first_name,
  e.last_name,
  DATE_TRUNC('month', ae.effort_date)::DATE as month_start,
  SUM(ae.hours_worked) as total_actual_hours,
  COUNT(DISTINCT ae.effort_date) as working_days,
  ROUND(SUM(ae.hours_worked)::NUMERIC / NULLIF(COUNT(DISTINCT ae.effort_date), 0), 2) as avg_daily_hours
FROM actual_efforts ae
JOIN employees e ON ae.employee_id = e.id
GROUP BY ae.company_id, ae.employee_id, e.first_name, e.last_name, DATE_TRUNC('month', ae.effort_date);

CREATE MATERIALIZED VIEW project_effort_summary AS
SELECT
  pe.company_id,
  pe.project_id,
  p.name as project_name,
  SUM(pe.total_hours) as total_projected_hours,
  (SELECT SUM(ee.estimated_hours) FROM estimated_efforts ee WHERE ee.project_id = pe.project_id) as total_estimated_hours,
  (SELECT SUM(ae.hours_worked) FROM actual_efforts ae WHERE ae.project_id = pe.project_id) as total_actual_hours
FROM projected_efforts pe
JOIN projects p ON pe.project_id = p.id
GROUP BY pe.company_id, pe.project_id, p.name;

-- Create indexes on materialized views
CREATE INDEX idx_employee_util_company ON employee_utilization_monthly(company_id);
CREATE INDEX idx_employee_util_month ON employee_utilization_monthly(month_start);
CREATE INDEX idx_project_summary_company ON project_effort_summary(company_id);

-- ============================================================================
-- KEKA SYNC TRACKING
-- ============================================================================

CREATE TABLE sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'clients', 'projects', 'employees', 'all'
  status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  triggered_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_runs_company ON sync_runs(company_id);
CREATE INDEX idx_sync_runs_entity ON sync_runs(entity_type);
CREATE INDEX idx_sync_runs_status ON sync_runs(status);
CREATE INDEX idx_sync_runs_started ON sync_runs(started_at DESC);

COMMIT;
