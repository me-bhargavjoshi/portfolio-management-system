"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KekaEmployeesSyncService = void 0;
const database_1 = require("../config/database");
const keka_1 = require("../integrations/keka");
const sync_tracking_1 = require("../services/sync-tracking");
class KekaEmployeesSyncService {
    constructor() {
        this.kekaClient = (0, keka_1.getKekaClient)();
        this.syncTracking = new sync_tracking_1.SyncTrackingService();
    }
    async syncEmployees(companyId) {
        const syncRunId = await this.syncTracking.startSyncRun({
            company_id: companyId,
            entity_type: 'employees',
        });
        const result = {
            success: false,
            synced: 0,
            failed: 0,
            errors: [],
            message: '',
        };
        try {
            console.log('🔄 Starting Keka employees sync...');
            const kekaResponse = await this.kekaClient.getEmployees({
                inProbation: false,
                inNoticePeriod: false,
            });
            if (!kekaResponse.success || !kekaResponse.data) {
                throw new Error(kekaResponse.error || 'Failed to fetch employees from Keka');
            }
            const kekaEmployees = kekaResponse.data;
            console.log(`📥 Fetched ${kekaEmployees.length} active employees from Keka`);
            for (const kekaEmployee of kekaEmployees) {
                try {
                    await this.syncEmployee(companyId, kekaEmployee);
                    result.synced++;
                }
                catch (error) {
                    result.failed++;
                    const errorMsg = `Failed to sync employee ${kekaEmployee.firstName} ${kekaEmployee.lastName}: ${error.message}`;
                    result.errors.push(errorMsg);
                    console.error(`❌ ${errorMsg}`);
                }
            }
            result.success = result.failed === 0;
            result.message = `Synced ${result.synced} employees${result.failed > 0 ? `, ${result.failed} failed` : ''}`;
            console.log(`✅ Employees sync complete: ${result.message}`);
            await this.syncTracking.completeSyncRun(syncRunId, {
                status: result.failed === 0 ? 'completed' : 'partial',
                records_synced: result.synced,
                records_failed: result.failed,
                errors: result.errors,
            });
            return result;
        }
        catch (error) {
            result.success = false;
            result.message = `Sync failed: ${error.message}`;
            result.errors.push(error.message);
            console.error(`❌ ${result.message}`);
            await this.syncTracking.completeSyncRun(syncRunId, {
                status: 'failed',
                records_synced: result.synced,
                records_failed: result.failed,
                errors: result.errors,
            });
            return result;
        }
    }
    async syncEmployee(companyId, kekaEmployee) {
        const pool = (0, database_1.getDatabase)();
        let department = null;
        if (kekaEmployee.department) {
            if (typeof kekaEmployee.department === 'string' && kekaEmployee.department.trim()) {
                department = kekaEmployee.department.trim();
            }
            else if (typeof kekaEmployee.department === 'object' && kekaEmployee.department.name) {
                department = kekaEmployee.department.name;
            }
        }
        const employeeData = {
            company_id: companyId,
            first_name: kekaEmployee.firstName,
            last_name: kekaEmployee.lastName,
            email: kekaEmployee.email,
            department: department,
            designation: kekaEmployee.designation || kekaEmployee.jobTitle?.title || null,
            is_active: kekaEmployee.employmentStatus === 0,
            keka_employee_id: kekaEmployee.id,
        };
        const result = await pool.query(`INSERT INTO employees (
        company_id, first_name, last_name, email, department, 
        designation, is_active, keka_employee_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (keka_employee_id) 
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        designation = EXCLUDED.designation,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING (xmax = 0) AS inserted`, [
            employeeData.company_id,
            employeeData.first_name,
            employeeData.last_name,
            employeeData.email,
            employeeData.department,
            employeeData.designation,
            employeeData.is_active,
            employeeData.keka_employee_id,
        ]);
        const wasInserted = result.rows[0].inserted;
        if (wasInserted) {
            console.log(`  ✨ Created employee: ${employeeData.first_name} ${employeeData.last_name}`);
        }
        else {
            console.log(`  ↻ Updated employee: ${employeeData.first_name} ${employeeData.last_name}`);
        }
    }
    async getSyncStatus() {
        const pool = (0, database_1.getDatabase)();
        const result = await pool.query(`SELECT COUNT(*) as count FROM employees WHERE keka_employee_id IS NOT NULL`);
        return {
            lastSync: null,
            count: parseInt(result.rows[0]?.count || '0', 10),
        };
    }
}
exports.KekaEmployeesSyncService = KekaEmployeesSyncService;
exports.default = KekaEmployeesSyncService;
//# sourceMappingURL=keka-employees-sync.js.map