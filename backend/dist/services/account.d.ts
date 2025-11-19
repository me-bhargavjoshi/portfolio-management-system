import { Pool } from 'pg';
export interface Account {
    id: string;
    company_id: string;
    client_id: string;
    name: string;
    description?: string;
    account_manager_id?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateAccountDTO {
    company_id: string;
    client_id: string;
    name: string;
    description?: string;
    account_manager_id?: string;
    is_active?: boolean;
}
export interface UpdateAccountDTO {
    name?: string;
    description?: string;
    account_manager_id?: string;
    is_active?: boolean;
}
export declare class AccountService {
    private pool;
    constructor(pool: Pool);
    createAccount(data: CreateAccountDTO): Promise<Account>;
    getAccountById(id: string): Promise<Account | null>;
    getAllAccounts(limit?: number, offset?: number): Promise<{
        accounts: Account[];
        total: number;
    }>;
    getAccountsByCompanyId(companyId: string, limit?: number, offset?: number): Promise<{
        accounts: Account[];
        total: number;
    }>;
    getAccountsByClientId(clientId: string, limit?: number, offset?: number): Promise<{
        accounts: Account[];
        total: number;
    }>;
    updateAccount(id: string, data: UpdateAccountDTO): Promise<Account | null>;
    deleteAccount(id: string): Promise<boolean>;
    getAccountHierarchy(accountId: string): Promise<Account[]>;
    searchAccounts(query: string, limit?: number): Promise<Account[]>;
}
//# sourceMappingURL=account.d.ts.map