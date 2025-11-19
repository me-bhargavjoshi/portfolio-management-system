import { KekaConfig } from '../config/keka';
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
    isArchived: boolean;
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
    employmentStatus: number;
    accountStatus?: number;
    invitationStatus?: number;
    exitStatus?: number;
    exitType?: number;
    exitDate?: string;
    resignationSubmittedDate?: string;
    isPrivate?: boolean;
    timeType?: number;
    workerType?: number;
    [key: string]: any;
}
export declare class KekaApiClient {
    private readonly config;
    private psaClient;
    private hrisClient;
    private maxRetries;
    private retryDelay;
    private detectedAuthHeaders;
    private tokenManager;
    constructor(config?: KekaConfig);
    private detectAuthMode;
    private setupInterceptors;
    private applyAuthHeaders;
    private ensureAuthApplied;
    private handleError;
    private retryRequest;
    getClients(): Promise<KekaApiResponse<KekaClient[]>>;
    getClient(id: string): Promise<KekaApiResponse<KekaClient>>;
    getProjects(): Promise<KekaApiResponse<KekaProject[]>>;
    getProject(id: string): Promise<KekaApiResponse<KekaProject>>;
    getEmployees(filters?: {
        inProbation?: boolean;
        inNoticePeriod?: boolean;
    }): Promise<KekaApiResponse<KekaEmployee[]>>;
    getEmployee(id: string): Promise<KekaApiResponse<KekaEmployee>>;
    testConnection(): Promise<boolean>;
}
export declare const getKekaClient: (config?: KekaConfig) => KekaApiClient;
export default KekaApiClient;
//# sourceMappingURL=keka.d.ts.map