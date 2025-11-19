export interface JWTPayload {
    userId: string;
    email: string;
    companyId: string;
    role: string;
}
export interface User {
    id: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    company_id: string;
    role: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Company {
    id: string;
    name: string;
    logo_url?: string;
    description?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Client {
    id: string;
    company_id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Account {
    id: string;
    client_id: string;
    company_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Project {
    id: string;
    account_id: string;
    company_id: string;
    name: string;
    description?: string;
    start_date: Date;
    end_date: Date;
    status: 'active' | 'completed' | 'on_hold' | 'cancelled';
    budget?: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Employee {
    id: string;
    company_id: string;
    keka_employee_id?: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
    designation?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=index.d.ts.map