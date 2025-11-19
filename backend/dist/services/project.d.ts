import { Pool } from 'pg';
export interface Project {
    id: string;
    company_id: string;
    account_id: string;
    name: string;
    description: string;
    start_date: Date;
    end_date: Date;
    budget: number;
    status: 'active' | 'completed' | 'on_hold' | 'cancelled';
    project_manager_id: string;
    billing_type: string;
    is_billable: boolean;
    keka_id: string;
    keka_client_id: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateProjectDTO {
    company_id: string;
    account_id: string;
    name: string;
    description?: string;
    start_date: Date;
    end_date: Date;
    budget?: number;
    status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
    project_manager_id?: string;
}
export interface UpdateProjectDTO {
    name?: string;
    description?: string;
    start_date?: Date;
    end_date?: Date;
    budget?: number;
    status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
    project_manager_id?: string;
}
export declare class ProjectService {
    private pool;
    constructor(pool: Pool);
    createProject(data: CreateProjectDTO): Promise<Project>;
    getProjectById(id: string): Promise<Project | null>;
    getAllProjects(limit?: number, offset?: number): Promise<{
        projects: Project[];
        total: number;
    }>;
    getProjectsByCompanyId(companyId: string, limit?: number, offset?: number): Promise<{
        projects: Project[];
        total: number;
    }>;
    getProjectsByAccountId(accountId: string, limit?: number, offset?: number): Promise<{
        projects: Project[];
        total: number;
    }>;
    updateProject(id: string, data: UpdateProjectDTO): Promise<Project | null>;
    deleteProject(id: string): Promise<boolean>;
    getActiveProjects(limit?: number): Promise<Project[]>;
    searchProjects(query: string, limit?: number): Promise<Project[]>;
}
//# sourceMappingURL=project.d.ts.map