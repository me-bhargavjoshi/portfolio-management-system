import { Pool } from 'pg';
export interface Company {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    website: string;
    industry: string;
    founded_year: number;
    employee_count: number;
    notes: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateCompanyDTO {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    website?: string;
    industry?: string;
    founded_year?: number;
    employee_count?: number;
    notes?: string;
}
export interface UpdateCompanyDTO {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    website?: string;
    industry?: string;
    founded_year?: number;
    employee_count?: number;
    notes?: string;
}
export declare class CompanyService {
    private pool;
    constructor(pool: Pool);
    createCompany(data: CreateCompanyDTO): Promise<Company>;
    getCompanyById(id: string): Promise<Company | null>;
    getAllCompanies(limit?: number, offset?: number): Promise<{
        companies: Company[];
        total: number;
    }>;
    updateCompany(id: string, data: UpdateCompanyDTO): Promise<Company | null>;
    deleteCompany(id: string): Promise<boolean>;
    searchCompanies(query: string, limit?: number): Promise<Company[]>;
}
//# sourceMappingURL=company.d.ts.map