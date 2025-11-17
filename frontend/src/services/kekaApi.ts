import { apiClient, ApiResponse } from './api';

// Keka API interfaces
export interface KekaEmployee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  job_title: string;
  department: string;
  location: string;
  employment_status: string;
  joining_date: string;
  phone: string;
  reports_to: string;
  l2_manager: string;
}

export interface KekaClient {
  id: string;
  name: string;
  billing_name: string;
  code: string;
  description: string;
  billing_address: string;
  client_contacts: any;
}

export interface KekaProject {
  id: string;
  client_id: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  status: number;
  is_billable: boolean;
  billing_type: number;
  budget: number;
  budgeted_time: number;
  project_managers: any;
  client_name: string;
  client_code: string;
}

export interface KekaTimeEntry {
  id: string;
  effort_date: string;
  hours_worked: number;
  entry_comments: string;
  is_billable: boolean;
  status: string;
  employee_name: string;
  employee_email: string;
  project_name: string;
  client_name: string;
  task_name: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProjectAnalytics {
  project_id: string;
  project_name: string;
  client_name: string;
  actual_hours: number;
  budgeted_hours: number;
  total_entries: number;
  employees_worked: number;
  budget_utilization_percent: number;
}

export interface DashboardMetrics {
  total_clients: number;
  active_projects: number;
  active_employees: number;
  total_tasks: number;
  current_month_hours: number;
  current_year_hours: number;
  total_hours_logged: number;
  total_active_budget: number;
  total_budgeted_hours: number;
  last_timesheet_date: string;
  last_week_entries: number;
}

// Keka Employees API
export const kekaEmployeesApi = {
  getEmployees: async (params?: PaginationParams & { department?: string; status?: string }): Promise<ApiResponse<KekaEmployee[]>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.department) query.append('department', params.department);
    if (params?.status) query.append('status', params.status);
    
    return apiClient.get(`/keka-employees${query.toString() ? '?' + query.toString() : ''}`);
  },

  getEmployeeById: async (id: string): Promise<ApiResponse<KekaEmployee>> => {
    return apiClient.get(`/keka-employees/${id}`);
  },

  getDepartments: async (): Promise<ApiResponse<{ department: string; employee_count: number }[]>> => {
    return apiClient.get('/keka-employees/departments');
  },

  getEmployeeTimeEntries: async (id: string, startDate?: string, endDate?: string): Promise<ApiResponse<KekaTimeEntry[]>> => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    
    return apiClient.get(`/keka-employees/${id}/time-entries${query.toString() ? '?' + query.toString() : ''}`);
  },
};

// Keka Clients API
export const kekaClientsApi = {
  getClients: async (params?: PaginationParams & { search?: string }): Promise<ApiResponse<KekaClient[]>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    return apiClient.get(`/keka-clients${query.toString() ? '?' + query.toString() : ''}`);
  },

  getClientById: async (id: string): Promise<ApiResponse<KekaClient>> => {
    return apiClient.get(`/keka-clients/${id}`);
  },

  getClientProjects: async (id: string, status?: string): Promise<ApiResponse<KekaProject[]>> => {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    
    return apiClient.get(`/keka-clients/${id}/projects${query.toString() ? '?' + query.toString() : ''}`);
  },

  getClientAnalytics: async (id: string, startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    
    return apiClient.get(`/keka-clients/${id}/analytics${query.toString() ? '?' + query.toString() : ''}`);
  },
};

// Keka Projects API
export const kekaProjectsApi = {
  getProjects: async (params?: PaginationParams & { clientId?: string; status?: string; search?: string }): Promise<ApiResponse<KekaProject[]>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    
    return apiClient.get(`/keka-projects${query.toString() ? '?' + query.toString() : ''}`);
  },

  getProjectById: async (id: string): Promise<ApiResponse<KekaProject>> => {
    return apiClient.get(`/keka-projects/${id}`);
  },

  getProjectTasks: async (id: string, status?: string): Promise<ApiResponse<any[]>> => {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    
    return apiClient.get(`/keka-projects/${id}/tasks${query.toString() ? '?' + query.toString() : ''}`);
  },

  getProjectTimeEntries: async (id: string, startDate?: string, endDate?: string, employeeId?: string): Promise<ApiResponse<KekaTimeEntry[]>> => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (employeeId) query.append('employeeId', employeeId);
    
    return apiClient.get(`/keka-projects/${id}/time-entries${query.toString() ? '?' + query.toString() : ''}`);
  },

  getProjectAnalytics: async (id: string, startDate?: string, endDate?: string): Promise<ApiResponse<ProjectAnalytics>> => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    
    return apiClient.get(`/keka-projects/${id}/analytics${query.toString() ? '?' + query.toString() : ''}`);
  },
};

// Dashboard API using Keka views
export const kekaDashboardApi = {
  getDashboardMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
    return apiClient.get('/keka/dashboard-metrics');
  },

  getRecentTimeEntries: async (limit: number = 10): Promise<ApiResponse<KekaTimeEntry[]>> => {
    return apiClient.get(`/keka/recent-timesheets?limit=${limit}`);
  },

  getTopProjects: async (limit: number = 5): Promise<ApiResponse<ProjectAnalytics[]>> => {
    return apiClient.get(`/keka/top-projects?limit=${limit}`);
  },
};

// Unified Keka API export
export const kekaApi = {
  employees: kekaEmployeesApi,
  clients: kekaClientsApi,
  projects: kekaProjectsApi,
  dashboard: kekaDashboardApi,
};