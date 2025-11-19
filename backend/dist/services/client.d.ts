import { Pool } from 'pg';
export interface Client {
    id: string;
    company_id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateClientDTO {
    company_id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    is_active?: boolean;
}
export interface UpdateClientDTO {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    is_active?: boolean;
}
export declare class ClientService {
    private pool;
    constructor(pool: Pool);
    createClient(data: CreateClientDTO): Promise<Client>;
    getClientById(id: string): Promise<Client | null>;
    getAllClients(limit?: number, offset?: number): Promise<{
        clients: Client[];
        total: number;
    }>;
    getClientsByCompanyId(companyId: string, limit?: number, offset?: number): Promise<{
        clients: Client[];
        total: number;
    }>;
    updateClient(id: string, data: UpdateClientDTO): Promise<Client | null>;
    deleteClient(id: string): Promise<boolean>;
    searchClients(query: string, limit?: number): Promise<Client[]>;
}
//# sourceMappingURL=client.d.ts.map