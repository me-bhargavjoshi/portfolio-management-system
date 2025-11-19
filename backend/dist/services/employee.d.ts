import { Pool } from 'pg';
export interface Employee {
    id: string;
    company_id: string;
    keka_employee_id?: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
    designation?: string;
    reporting_manager_id?: string;
    billable_rate?: number;
    cost_per_hour?: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateEmployeeDTO {
    company_id: string;
    first_name: string;
    last_name: string;
    email: string;
    keka_employee_id?: string;
    department?: string;
    designation?: string;
    reporting_manager_id?: string;
    billable_rate?: number;
    cost_per_hour?: number;
    is_active?: boolean;
}
export interface UpdateEmployeeDTO {
    first_name?: string;
    last_name?: string;
    email?: string;
    keka_employee_id?: string;
    department?: string;
    designation?: string;
    reporting_manager_id?: string;
    billable_rate?: number;
    cost_per_hour?: number;
    date_of_exit?: Date;
    is_active?: boolean;
    skills?: string;
    notes?: string;
}
export declare class EmployeeService {
    private pool;
    constructor(pool: Pool);
    createEmployee(data: CreateEmployeeDTO): Promise<Employee>;
    getEmployeeById(id: string): Promise<Employee | null>;
    getAllEmployees(limit?: number, offset?: number): Promise<{
        employees: Employee[];
        total: number;
    }>;
    getEmployeesByCompanyId(companyId: string, limit?: number, offset?: number): Promise<{
        employees: Employee[];
        total: number;
    }>;
    getActiveEmployeesCount(companyId?: string): Promise<number>;
    updateEmployee(id: string, data: UpdateEmployeeDTO): Promise<Employee | null>;
    deleteEmployee(id: string): Promise<boolean>;
    searchEmployees(query: string, limit?: number): Promise<Employee[]>;
    getEmployeesByDepartment(department: string, companyId?: string, limit?: number): Promise<Employee[]>;
}
//# sourceMappingURL=employee.d.ts.map