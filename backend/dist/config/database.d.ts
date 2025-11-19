import { Pool } from 'pg';
export declare const initDatabase: () => Promise<Pool>;
export declare const getDatabase: () => Pool;
export declare const closeDatabase: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map