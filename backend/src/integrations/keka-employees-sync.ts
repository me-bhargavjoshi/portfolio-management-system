/**
 * Keka Employees Sync Service
 * 
 * Handles synchronization of employees from Keka HRIS API to our database
 * Maps Keka employee data to our employee schema and performs upsert operations
 */

import { getDatabase } from '../config/database';
import { getKekaClient, KekaEmployee } from '../integrations/keka';
import { SyncTrackingService } from '../services/sync-tracking';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  message: string;
}

/**
 * Keka Employees Sync Service
 */
export class KekaEmployeesSyncService {
  private kekaClient = getKekaClient();
  private syncTracking = new SyncTrackingService();

  /**
   * Sync all employees from Keka to our database
   */
  async syncEmployees(companyId: string): Promise<SyncResult> {
    const syncRunId = await this.syncTracking.startSyncRun({
      company_id: companyId,
      entity_type: 'employees',
    });
    
    const result: SyncResult = {
      success: false,
      synced: 0,
      failed: 0,
      errors: [],
      message: '',
    };

    try {
      console.log('🔄 Starting Keka employees sync...');

      // Fetch employees from Keka (excluding probation and notice period)
      const kekaResponse = await this.kekaClient.getEmployees({
        inProbation: false,
        inNoticePeriod: false,
      });

      if (!kekaResponse.success || !kekaResponse.data) {
        throw new Error(kekaResponse.error || 'Failed to fetch employees from Keka');
      }

      const kekaEmployees = kekaResponse.data;
      console.log(`📥 Fetched ${kekaEmployees.length} active employees from Keka`);

      // Sync each employee
      for (const kekaEmployee of kekaEmployees) {
        try {
          await this.syncEmployee(companyId, kekaEmployee);
          result.synced++;
        } catch (error: any) {
          result.failed++;
          const errorMsg = `Failed to sync employee ${kekaEmployee.firstName} ${kekaEmployee.lastName}: ${error.message}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      result.success = result.failed === 0;
      result.message = `Synced ${result.synced} employees${result.failed > 0 ? `, ${result.failed} failed` : ''}`;
      console.log(`✅ Employees sync complete: ${result.message}`);

      // Complete sync run
      await this.syncTracking.completeSyncRun(syncRunId, {
        status: result.failed === 0 ? 'completed' : 'partial',
        records_synced: result.synced,
        records_failed: result.failed,
        errors: result.errors,
      });

      return result;
    } catch (error: any) {
      result.success = false;
      result.message = `Sync failed: ${error.message}`;
      result.errors.push(error.message);
      console.error(`❌ ${result.message}`);
      
      // Mark sync run as failed
      await this.syncTracking.completeSyncRun(syncRunId, {
        status: 'failed',
        records_synced: result.synced,
        records_failed: result.failed,
        errors: result.errors,
      });
      
      return result;
    }
  }

  /**
   * Sync individual employee from Keka
   */
  private async syncEmployee(companyId: string, kekaEmployee: KekaEmployee): Promise<void> {
    const pool = getDatabase();

    // Map Keka employee to our schema
    // employmentStatus: 0 = Working, 1 = Relieved
    
    // Extract department - only use what Keka provides, otherwise null (will show as "-" in UI)
    let department = null;
    if (kekaEmployee.department) {
      if (typeof kekaEmployee.department === 'string' && kekaEmployee.department.trim()) {
        department = kekaEmployee.department.trim();
      } else if (typeof kekaEmployee.department === 'object' && (kekaEmployee.department as any).name) {
        department = (kekaEmployee.department as any).name;
      }
    }
    
    const employeeData = {
      company_id: companyId,
      first_name: kekaEmployee.firstName,
      last_name: kekaEmployee.lastName,
      email: kekaEmployee.email,
      department: department,
      designation: kekaEmployee.designation || kekaEmployee.jobTitle?.title || null,
      is_active: kekaEmployee.employmentStatus === 0, // 0 = Working (active)
      keka_employee_id: kekaEmployee.id,
    };

    // Use UPSERT (INSERT ... ON CONFLICT) for atomic operation
    const result = await pool.query(
      `INSERT INTO employees (
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
      RETURNING (xmax = 0) AS inserted`,
      [
        employeeData.company_id,
        employeeData.first_name,
        employeeData.last_name,
        employeeData.email,
        employeeData.department,
        employeeData.designation,
        employeeData.is_active,
        employeeData.keka_employee_id,
      ]
    );

    const wasInserted = result.rows[0].inserted;
    if (wasInserted) {
      console.log(`  ✨ Created employee: ${employeeData.first_name} ${employeeData.last_name}`);
    } else {
      console.log(`  ↻ Updated employee: ${employeeData.first_name} ${employeeData.last_name}`);
    }
  }

  /**
   * Get sync status for employees
   */
  /**
   * Get sync status for employees
   */
  async getSyncStatus(): Promise<{ lastSync: Date | null; count: number }> {
    const pool = getDatabase();
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM employees WHERE keka_employee_id IS NOT NULL`
    );
    return {
      lastSync: null, // TODO: Use sync_runs table for last sync info
      count: parseInt(result.rows[0]?.count || '0', 10),
    };
  }
}

export default KekaEmployeesSyncService;
