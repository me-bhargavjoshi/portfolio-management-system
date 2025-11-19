"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KekaProjectsSyncService = void 0;
const database_1 = require("../config/database");
const keka_1 = require("../integrations/keka");
const sync_tracking_1 = require("../services/sync-tracking");
class KekaProjectsSyncService {
    constructor() {
        this.kekaClient = (0, keka_1.getKekaClient)();
        this.syncTracking = new sync_tracking_1.SyncTrackingService();
    }
    async syncProjects(companyId) {
        const syncRunId = await this.syncTracking.startSyncRun({
            company_id: companyId,
            entity_type: 'projects',
        });
        const result = {
            success: false,
            synced: 0,
            failed: 0,
            errors: [],
            message: '',
        };
        try {
            console.log('🔄 Starting Keka projects sync...');
            const kekaResponse = await this.kekaClient.getProjects();
            if (!kekaResponse.success || !kekaResponse.data) {
                throw new Error(kekaResponse.error || 'Failed to fetch projects from Keka');
            }
            const kekaProjects = kekaResponse.data;
            console.log(`📥 Fetched ${kekaProjects.length} projects from Keka`);
            for (const kekaProject of kekaProjects) {
                try {
                    await this.syncProject(companyId, kekaProject);
                    result.synced++;
                }
                catch (error) {
                    result.failed++;
                    const errorMsg = `Failed to sync project ${kekaProject.name}: ${error.message}`;
                    result.errors.push(errorMsg);
                    console.error(`❌ ${errorMsg}`);
                }
            }
            result.success = result.failed === 0;
            result.message = `Synced ${result.synced} projects${result.failed > 0 ? `, ${result.failed} failed` : ''}`;
            console.log(`✅ Projects sync complete: ${result.message}`);
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
    async syncProject(companyId, kekaProject) {
        const pool = (0, database_1.getDatabase)();
        let accountId = null;
        if (kekaProject.clientId) {
            let accountResult = await pool.query('SELECT id FROM accounts WHERE keka_client_id = $1 LIMIT 1', [kekaProject.clientId]);
            if (accountResult.rows.length > 0) {
                accountId = accountResult.rows[0].id;
            }
            else {
                const clientResult = await pool.query('SELECT id, name FROM clients WHERE keka_id = $1', [kekaProject.clientId]);
                if (clientResult.rows.length > 0) {
                    const client = clientResult.rows[0];
                    const newAccountResult = await pool.query(`INSERT INTO accounts (company_id, client_id, name, keka_client_id, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, true, NOW(), NOW())
             RETURNING id`, [companyId, client.id, `${client.name} - Account`, kekaProject.clientId]);
                    accountId = newAccountResult.rows[0].id;
                    console.log(`  ✨ Created account for client: ${client.name}`);
                }
            }
        }
        if (!accountId) {
            let defaultAccountResult = await pool.query('SELECT id FROM accounts WHERE company_id = $1 AND name = $2 LIMIT 1', [companyId, 'Default Account']);
            if (defaultAccountResult.rows.length > 0) {
                accountId = defaultAccountResult.rows[0].id;
            }
            else {
                const clientResult = await pool.query('SELECT id FROM clients WHERE company_id = $1 LIMIT 1', [companyId]);
                if (clientResult.rows.length > 0) {
                    const newAccountResult = await pool.query(`INSERT INTO accounts (company_id, client_id, name, is_active, created_at, updated_at)
             VALUES ($1, $2, 'Default Account', true, NOW(), NOW())
             RETURNING id`, [companyId, clientResult.rows[0].id]);
                    accountId = newAccountResult.rows[0].id;
                    console.log(`  ✨ Created default account`);
                }
            }
        }
        if (!accountId) {
            console.warn(`  ⚠️  Project ${kekaProject.name} - no account available, skipping`);
            return;
        }
        let billingType = null;
        if (kekaProject.billingType !== undefined && kekaProject.billingType !== null) {
            switch (kekaProject.billingType) {
                case 0:
                    billingType = 'Non-billable';
                    break;
                case 1:
                    billingType = 'Fixed-price';
                    break;
                case 2:
                    billingType = 'Time & Material';
                    break;
                case 4:
                    billingType = 'Retainer';
                    break;
                default:
                    billingType = `Type ${kekaProject.billingType}`;
            }
        }
        const projectData = {
            company_id: companyId,
            account_id: accountId,
            name: kekaProject.name,
            description: kekaProject.description || null,
            start_date: kekaProject.startDate || new Date().toISOString().split('T')[0],
            end_date: kekaProject.endDate || null,
            budget: kekaProject.budget || null,
            status: kekaProject.status || 'active',
            is_active: !kekaProject.isArchived,
            billing_type: billingType,
            is_billable: kekaProject.isBillable || false,
            keka_id: kekaProject.id,
            keka_client_id: kekaProject.clientId || null,
        };
        const result = await pool.query(`INSERT INTO projects (
        company_id, account_id, name, description, start_date, end_date, 
        budget, status, is_active, billing_type, is_billable, keka_id, keka_client_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      ON CONFLICT (keka_id) 
      DO UPDATE SET
        account_id = EXCLUDED.account_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        budget = EXCLUDED.budget,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        billing_type = EXCLUDED.billing_type,
        is_billable = EXCLUDED.is_billable,
        keka_client_id = EXCLUDED.keka_client_id,
        updated_at = NOW()
      RETURNING (xmax = 0) AS inserted`, [
            projectData.company_id,
            projectData.account_id,
            projectData.name,
            projectData.description,
            projectData.start_date,
            projectData.end_date,
            projectData.budget,
            projectData.status,
            projectData.is_active,
            projectData.billing_type,
            projectData.is_billable,
            projectData.keka_id,
            projectData.keka_client_id,
        ]);
        const wasInserted = result.rows[0].inserted;
        if (wasInserted) {
            console.log(`  ✨ Created project: ${projectData.name}`);
        }
        else {
            console.log(`  ↻ Updated project: ${projectData.name}`);
        }
    }
    async getSyncStatus() {
        const pool = (0, database_1.getDatabase)();
        const result = await pool.query(`SELECT COUNT(*) as count FROM projects WHERE keka_id IS NOT NULL AND is_active = true`);
        return {
            lastSync: null,
            count: parseInt(result.rows[0]?.count || '0', 10),
        };
    }
}
exports.KekaProjectsSyncService = KekaProjectsSyncService;
exports.default = KekaProjectsSyncService;
//# sourceMappingURL=keka-projects-sync.js.map