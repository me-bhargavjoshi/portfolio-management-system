const API_BASE_URL = ((import.meta as any).env.VITE_API_URL as string) || 'http://127.0.0.1:3001/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
    };
  };
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data as ApiResponse<T>;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }
}

export const apiClient = new ApiClient();

// Authentication API functions
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<any>('/auth/login', credentials);
  },

  register: async (credentials: RegisterRequest): Promise<AuthResponse> => {
    return apiClient.post<any>('/auth/register', credentials);
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ token: string }>> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<void>('/auth/logout', {});
    apiClient.clearToken();
    return response;
  },

  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/auth/me');
  },
};

// Dashboard API functions
export const dashboardApi = {
  getDashboardData: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/dashboard');
  },
};

// Projects API functions
export const projectsApi = {
  getProjects: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/projects');
  },
};

// Employees API functions
export const employeesApi = {
  getEmployees: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/employees');
  },
};
