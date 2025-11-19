"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const database_1 = require("../config/database");
const keka_employees_sync_1 = require("../integrations/keka-employees-sync");
async function main() {
    const pool = await (0, database_1.initDatabase)();
    try {
        const r = await pool.query('SELECT id, name FROM companies ORDER BY created_at DESC LIMIT 1');
        if (r.rows.length === 0) {
            console.error('No company found in database. Create a company first.');
            process.exit(1);
        }
        const company = r.rows[0];
        console.log(`Using company: ${company.id} (${company.name})`);
        const svc = new keka_employees_sync_1.KekaEmployeesSyncService();
        const result = await svc.syncEmployees(company.id);
        console.log('Sync result:', JSON.stringify(result, null, 2));
    }
    catch (err) {
        console.error('Error running sync script:', err?.message || err);
        process.exit(2);
    }
    finally {
        setTimeout(() => process.exit(0), 500);
    }
}
main();
//# sourceMappingURL=run-keka-emp-sync.js.map