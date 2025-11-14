/**
 * Keka API Client
 * 
 * Handles HTTP communication with Keka APIs
 * Includes API Key authentication, error handling, and retries
 * 
 * Uses separate clients for PSA and HRIS endpoints
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { kekaConfig, KekaConfig } from '../config/keka';
import KekaTokenManager from './keka-token';

export interface KekaApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface KekaClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface KekaProject {
  id: string;
  name: string;
  description?: string;
  code?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status?: string;
  projectBudget?: number;
  budgetedTime?: number;
  isArchived: boolean; // Keka uses isArchived, not isActive
  isBillable?: boolean;
  billingType?: number;
  projectManagers?: any[];
  [key: string]: any;
}

export interface KekaEmployee {
  id: string;
  employeeNumber?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  department?: string;
  designation?: string;
  jobTitle?: {
    identifier: string;
    title: string;
  };
  reportsTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  joiningDate?: string;
  employmentStatus: number; // 0 = Working, 1 = Relieved
  accountStatus?: number; // 0 = NotRegistered, 1 = Registered, 2 = Disabled
  invitationStatus?: number; // 0 = NotInvited, 1 = Invited
  exitStatus?: number;
  exitType?: number;
  exitDate?: string;
  resignationSubmittedDate?: string;
  isPrivate?: boolean;
  timeType?: number; // 0 = None, 1 = FullTime, 2 = PartTime
  workerType?: number; // 0 = None, 1 = Permanent, 2 = Contingent
  [key: string]: any;
}

/**
 * Keka API Client for making authenticated requests
 * Uses API Key-based authentication
 */
export class KekaApiClient {
  private psaClient: AxiosInstance;
  private hrisClient: AxiosInstance;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms
  // headers chosen after detection (cached)
  private detectedAuthHeaders: Record<string, string> | null = null;
  private tokenManager: KekaTokenManager;

  constructor(private readonly config: KekaConfig = kekaConfig) {
    // Ensure config is used
    void this.config;

    // Create lightweight clients (no auth headers yet)
    this.psaClient = axios.create({
      baseURL: this.config.psaBaseUrl,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.hrisClient = axios.create({
      baseURL: this.config.hrisBaseUrl,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // If an explicit HRIS bearer token is provided in config, apply it directly
    if (this.config.hrisBearerToken) {
      // @ts-ignore
      this.hrisClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.hrisBearerToken}`;
      console.log('🔒 Applied HRIS bearer token from config for Keka HRIS requests');
    }

    this.setupInterceptors();

    // initialize token manager
    this.tokenManager = new KekaTokenManager(this.config);
  }

  /**
   * Try several authentication header permutations against the PSA clients endpoint
   * and cache the successful header set. This avoids hard-coding a single auth
   * mechanism and makes the integration robust to small provider differences.
   */
  private async detectAuthMode(): Promise<Record<string, string> | null> {
    if (this.detectedAuthHeaders) return this.detectedAuthHeaders;

    const credentialsBase64 = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const strategies: Array<{ name: string; headers: Record<string, string> }> = [
      {
        name: 'basic+X-API-Key',
        headers: {
          Authorization: `Basic ${credentialsBase64}`,
          'X-API-Key': this.config.apiKey,
        },
      },
      {
        name: 'bearer-api-key',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      },
      {
        name: 'x-api-key-only',
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      },
      {
        name: 'basic-clientid-apikey',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.apiKey}`).toString('base64')}`,
        },
      },
      {
        name: 'client-id-secret-headers',
        headers: {
          'X-Client-Id': this.config.clientId,
          'X-Client-Secret': this.config.clientSecret,
          'X-API-Key': this.config.apiKey,
        },
      },
    ];

    for (const s of strategies) {
      try {
        console.log(`🔎 Trying Keka auth strategy: ${s.name}`);
        const resp = await axios.get(`${this.config.psaBaseUrl}/clients`, {
          headers: s.headers,
          timeout: Math.min(this.config.timeout, 5000),
        });
        if (resp && resp.status && resp.status >= 200 && resp.status < 300) {
          console.log(`✅ Keka auth strategy succeeded: ${s.name}`);
          this.detectedAuthHeaders = s.headers;
          return this.detectedAuthHeaders;
        }
      } catch (err: any) {
        // log and continue
        console.log(`⛔ Strategy ${s.name} failed: ${err?.response?.status || err?.message || 'no response'}`);
        continue;
      }
    }

    console.warn('⚠️  No Keka auth strategy succeeded');
    return null;
  }

  /**
   * Setup request/response interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // PSA Client Interceptor
    this.psaClient.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error, 'PSA')
    );

    // HRIS Client Interceptor
    this.hrisClient.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error, 'HRIS')
    );
  }

  /**
   * Apply detected headers to axios clients so subsequent requests use them
   */
  private applyAuthHeaders(headers: Record<string, string>): void {
    if (!headers) return;
    // PSA
    Object.entries(headers).forEach(([k, v]) => {
      // Axios stores common headers in defaults.headers.common
      // and method-specific headers in defaults.headers[method]
      // We'll set common headers so they apply to all requests.
      // @ts-ignore
      this.psaClient.defaults.headers.common[k] = v;
      // @ts-ignore
      this.hrisClient.defaults.headers.common[k] = v;
    });
  }

  /**
   * Ensure we have detected and applied a working auth header set
   */
  private async ensureAuthApplied(): Promise<void> {
    // First try token manager (preferred): fetch OAuth2 token and apply
    try {
      const token = await this.tokenManager.getToken();
      if (token) {
        // Apply as Authorization: Bearer <token> for PSA and HRIS
        // @ts-ignore
        this.psaClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // @ts-ignore
        this.hrisClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return;
      }
    } catch (err) {
      // proceed to fallback strategies
      console.warn('Keka token manager did not return a token, falling back to header detection');
    }

    if (this.detectedAuthHeaders) return;
    const headers = await this.detectAuthMode();
    if (headers) {
      this.applyAuthHeaders(headers);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError, api: string): Promise<never> {
    const info = {
      api,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    };

    // Log structured error for observability
    try {
      console.error(`❌ Keka ${api} API Error: ${JSON.stringify(info)}`);
    } catch (e) {
      // fallback logging
      console.error('❌ Keka API Error (logging failure)', info);
    }

    // Reject with a normalized Error containing JSON payload so callers
    // can parse/inspect the status and response body easily.
    const err = new Error(JSON.stringify(info));
    return Promise.reject(err);
  }

  /**
   * Retry logic for failed requests
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt < this.maxRetries) {
        console.log(`⏳ Retrying (attempt ${attempt + 1}/${this.maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.retryRequest(fn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Fetch all clients from Keka PSA API
   * GET /psa/clients
   */
  async getClients(): Promise<KekaApiResponse<KekaClient[]>> {
    try {
      console.log('📥 Fetching clients from Keka PSA API...');
      await this.ensureAuthApplied();
      const response = await this.retryRequest(() =>
        this.psaClient.get('/clients')
      );

      // Keka API wraps the data in a 'data' property
      const clients = Array.isArray(response.data?.data) ? response.data.data : 
                     Array.isArray(response.data) ? response.data : [];
      
      console.log(`✅ Fetched ${clients.length} clients from Keka`);
      return {
        success: true,
        data: clients,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch clients from Keka:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch clients',
      };
    }
  }

  /**
   * Fetch specific client from Keka PSA API
   * GET /psa/clients/:id
   */
  async getClient(id: string): Promise<KekaApiResponse<KekaClient>> {
    try {
      console.log(`📥 Fetching client ${id} from Keka PSA API...`);
      await this.ensureAuthApplied();
      const response = await this.retryRequest(() =>
        this.psaClient.get<KekaClient>(`/clients/${id}`)
      );

      console.log(`✅ Fetched client ${id} from Keka`);
      return {
        success: true,
        data: response.data as KekaClient,
      };
    } catch (error: any) {
      console.error(`❌ Failed to fetch client ${id}:`, error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch client',
      };
    }
  }

  /**
   * Fetch all projects from Keka PSA API
   * GET /psa/projects
   */
  async getProjects(): Promise<KekaApiResponse<KekaProject[]>> {
    try {
      console.log('📥 Fetching projects from Keka PSA API...');
      await this.ensureAuthApplied();
      const response = await this.retryRequest(() =>
        this.psaClient.get('/projects')
      );

      // Keka API wraps the data in a 'data' property
      const projects = Array.isArray(response.data?.data) ? response.data.data : 
                      Array.isArray(response.data) ? response.data : [];

      console.log(`✅ Fetched ${projects.length} projects from Keka`);
      return {
        success: true,
        data: projects,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch projects from Keka:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch projects',
      };
    }
  }

  /**
   * Fetch specific project from Keka PSA API
   * GET /psa/projects/:id
   */
  async getProject(id: string): Promise<KekaApiResponse<KekaProject>> {
    try {
      console.log(`📥 Fetching project ${id} from Keka PSA API...`);
      await this.ensureAuthApplied();
      const response = await this.retryRequest(() =>
        this.psaClient.get<KekaProject>(`/projects/${id}`)
      );

      console.log(`✅ Fetched project ${id} from Keka`);
      return {
        success: true,
        data: response.data as KekaProject,
      };
    } catch (error: any) {
      console.error(`❌ Failed to fetch project ${id}:`, error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch project',
      };
    }
  }

  /**
   * Fetch all employees from Keka HRIS API
   * GET /hris/employees?inProbation=false&inNoticePeriod=false
   */
  async getEmployees(filters?: {
    inProbation?: boolean;
    inNoticePeriod?: boolean;
  }): Promise<KekaApiResponse<KekaEmployee[]>> {
    try {
      console.log('📥 Fetching employees from Keka HRIS API...');
      await this.ensureAuthApplied();
      
      // Default filters: exclude probation and notice period employees
      const defaultFilters = {
        inProbation: false,
        inNoticePeriod: false,
        ...filters,
      };

      const queryParams = new URLSearchParams();
      Object.entries(defaultFilters).forEach(([k, v]) => {
        queryParams.append(k, String(v));
      });
      const queryString = queryParams.toString();

      const response = await this.retryRequest(() =>
        this.hrisClient.get<KekaEmployee[]>(`/employees?${queryString}`)
      );

      // Keka HRIS returns either an array or an object { data: [...] }
      const raw = response.data as any;
      const employees: KekaEmployee[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : [];

      console.log(`✅ Fetched ${employees.length} employees from Keka`);
      return {
        success: true,
        data: employees,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch employees from Keka:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch employees',
      };
    }
  }

  /**
   * Fetch specific employee from Keka HRIS API
   * GET /hris/employees/:id
   */
  async getEmployee(id: string): Promise<KekaApiResponse<KekaEmployee>> {
    try {
      console.log(`📥 Fetching employee ${id} from Keka HRIS API...`);
      await this.ensureAuthApplied();
      const response = await this.retryRequest(() =>
        this.hrisClient.get<KekaEmployee>(`/employees/${id}`)
      );

      console.log(`✅ Fetched employee ${id} from Keka`);
      return {
        success: true,
        data: response.data as KekaEmployee,
      };
    } catch (error: any) {
      console.error(`❌ Failed to fetch employee ${id}:`, error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch employee',
      };
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Keka API connection...');
      await this.ensureAuthApplied();
      await Promise.all([
        this.psaClient.get('/clients'),
        this.hrisClient.get('/employees?inProbation=false&inNoticePeriod=false'),
      ]);
      console.log('✅ Keka API connection test successful');
      return true;
    } catch (error: any) {
      console.error('❌ Keka API connection test failed:', error.message);
      return false;
    }
  }
}

/**
 * Singleton instance of Keka API Client
 */
let kekaClientInstance: KekaApiClient | null = null;

/**
 * Get or create Keka API Client instance
 */
export const getKekaClient = (config?: KekaConfig): KekaApiClient => {
  if (!kekaClientInstance) {
    kekaClientInstance = new KekaApiClient(config || kekaConfig);
  }
  return kekaClientInstance;
};

export default KekaApiClient;
