import { User } from '../types';
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterCredentials extends LoginCredentials {
    firstName: string;
    lastName: string;
    companyId?: string;
}
export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: Omit<User, 'password_hash'>;
}
export declare class AuthService {
    static register(credentials: RegisterCredentials): Promise<AuthResponse>;
    static login(credentials: LoginCredentials): Promise<AuthResponse>;
    static verifyToken(token: string): Promise<any>;
    static refreshToken(refreshToken: string): Promise<{
        token: string;
    }>;
    static logout(userId: string): Promise<void>;
    private static generateToken;
    private static generateRefreshToken;
}
//# sourceMappingURL=auth.d.ts.map