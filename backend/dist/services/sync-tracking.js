"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncTrackingService = void 0;
const database_1 = require("../config/database");
class SyncTrackingService {
    async startSyncRun(data) {
        const pool = (0, database_1.getDatabase)();
        const query = `
      INSERT INTO sync_runs (company_id, entity_type, status, triggered_by)
      VALUES ($1, $2, 'running', $3)
      RETURNING id
    `;
        const result = await pool.query(query, [
            data.company_id,
            data.entity_type,
            data.triggered_by || null,
        ]);
        return result.rows[0].id;
    }
    async completeSyncRun(syncRunId, data) {
        const pool = (0, database_1.getDatabase)();
        const startResult = await pool.query('SELECT started_at FROM sync_runs WHERE id = $1', [syncRunId]);
        if (!startResult.rows.length) {
            throw new Error(`Sync run ${syncRunId} not found`);
        }
        const startedAt = new Date(startResult.rows[0].started_at);
        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();
        const query = `
      UPDATE sync_runs
      SET status = $1,
          records_synced = $2,
          records_failed = $3,
          errors = $4,
          completed_at = $5,
          duration_ms = $6
      WHERE id = $7
    `;
        await pool.query(query, [
            data.status,
            data.records_synced,
            data.records_failed,
            JSON.stringify(data.errors || []),
            completedAt,
            durationMs,
            syncRunId,
        ]);
    }
    async getSyncHistory(companyId, entityType, limit = 50) {
        const pool = (0, database_1.getDatabase)();
        let query = `
      SELECT *
      FROM sync_runs
      WHERE company_id = $1
    `;
        const params = [companyId];
        if (entityType) {
            query += ' AND entity_type = $2';
            params.push(entityType);
        }
        query += ' ORDER BY started_at DESC LIMIT $' + (params.length + 1);
        params.push(limit);
        const result = await pool.query(query, params);
        return result.rows;
    }
    async getLastSync(companyId, entityType) {
        const pool = (0, database_1.getDatabase)();
        const query = `
      SELECT *
      FROM sync_runs
      WHERE company_id = $1 AND entity_type = $2 AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1
    `;
        const result = await pool.query(query, [companyId, entityType]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    async isSyncRunning(companyId, entityType) {
        const pool = (0, database_1.getDatabase)();
        const query = `
      SELECT COUNT(*) as count
      FROM sync_runs
      WHERE company_id = $1 AND entity_type = $2 AND status = 'running'
    `;
        const result = await pool.query(query, [companyId, entityType]);
        return parseInt(result.rows[0].count, 10) > 0;
    }
    async getSyncStats(companyId) {
        const pool = (0, database_1.getDatabase)();
        const statsQuery = `
      SELECT
        COUNT(*) as total_runs,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_runs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
        COALESCE(SUM(records_synced), 0) as total_records_synced
      FROM sync_runs
      WHERE company_id = $1
    `;
        const lastSyncQuery = `
      SELECT DISTINCT ON (entity_type)
        entity_type,
        completed_at
      FROM sync_runs
      WHERE company_id = $1 AND status = 'completed'
      ORDER BY entity_type, completed_at DESC
    `;
        const [statsResult, lastSyncResult] = await Promise.all([
            pool.query(statsQuery, [companyId]),
            pool.query(lastSyncQuery, [companyId]),
        ]);
        const stats = statsResult.rows[0];
        const lastSyncByType = {};
        lastSyncResult.rows.forEach((row) => {
            lastSyncByType[row.entity_type] = row.completed_at;
        });
        return {
            totalRuns: parseInt(stats.total_runs, 10),
            successfulRuns: parseInt(stats.successful_runs, 10),
            failedRuns: parseInt(stats.failed_runs, 10),
            totalRecordsSynced: parseInt(stats.total_records_synced, 10),
            lastSyncByType,
        };
    }
}
exports.SyncTrackingService = SyncTrackingService;
exports.default = new SyncTrackingService();
//# sourceMappingURL=sync-tracking.js.map