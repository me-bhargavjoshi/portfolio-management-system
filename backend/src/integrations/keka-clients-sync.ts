/**
 * Keka Clients Sync Service
 * 
 * Handles synchronization of clients from Keka PSA API to our database
 * Maps Keka client data to our client schema and performs upsert operations
 */

import { getDatabase } from '../config/database';
import { getKekaClient, KekaClient } from '../integrations/keka';
import { SyncTrackingService } from '../services/sync-tracking';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  message: string;
}

/**
 * Keka Clients Sync Service
 */
export class KekaClientsSyncService {
  private kekaClient = getKekaClient();
  private syncTracking = new SyncTrackingService();

  /**
   * Sync all clients from Keka to our database
   */
  async syncClients(companyId: string): Promise<SyncResult> {
    const syncRunId = await this.syncTracking.startSyncRun({
      company_id: companyId,
      entity_type: 'clients',
    });
    
    const result: SyncResult = {
      success: false,
      synced: 0,
      failed: 0,
      errors: [],
      message: '',
    };

    try {
      console.log('🔄 Starting Keka clients sync...');

      // Fetch clients from Keka
      const kekaResponse = await this.kekaClient.getClients();
      if (!kekaResponse.success || !kekaResponse.data) {
        throw new Error(kekaResponse.error || 'Failed to fetch clients from Keka');
      }

      const kekaClients = kekaResponse.data;
      console.log(`📥 Fetched ${kekaClients.length} clients from Keka`);

      // Sync each client
      for (const kekaClient of kekaClients) {
        try {
          await this.syncClient(companyId, kekaClient);
          result.synced++;
        } catch (error: any) {
          result.failed++;
          const errorMsg = `Failed to sync client ${kekaClient.name}: ${error.message}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      result.success = result.failed === 0;
      result.message = `Synced ${result.synced} clients${result.failed > 0 ? `, ${result.failed} failed` : ''}`;
      console.log(`✅ Clients sync complete: ${result.message}`);

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
   * Sync individual client from Keka
   */
  private async syncClient(companyId: string, kekaClient: KekaClient): Promise<void> {
    const pool = getDatabase();
    
    // Map Keka client to our schema
    const clientData = {
      company_id: companyId,
      name: kekaClient.name,
      email: kekaClient.email || null,
      phone: kekaClient.phone || null,
      address: kekaClient.address || null,
      city: kekaClient.city || null,
      state: kekaClient.state || null,
      country: kekaClient.country || null,
      postal_code: kekaClient.postalCode || null,
      is_active: kekaClient.isActive !== false,
      keka_id: kekaClient.id,
    };

    // Use UPSERT (INSERT ... ON CONFLICT) for atomic operation
    const result = await pool.query(
      `INSERT INTO clients (
        company_id, name, email, phone, address, city, state, country, 
        postal_code, is_active, keka_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      ON CONFLICT (keka_id) 
      DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        postal_code = EXCLUDED.postal_code,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING (xmax = 0) AS inserted`,
      [
        clientData.company_id,
        clientData.name,
        clientData.email,
        clientData.phone,
        clientData.address,
        clientData.city,
        clientData.state,
        clientData.country,
        clientData.postal_code,
        clientData.is_active,
        clientData.keka_id,
      ]
    );

    const wasInserted = result.rows[0].inserted;
    if (wasInserted) {
      console.log(`  ✨ Created client: ${clientData.name}`);
    } else {
      console.log(`  ↻ Updated client: ${clientData.name}`);
    }
  }

  /**
   * Get sync status for clients
   */
  async getSyncStatus(): Promise<{ lastSync: Date | null; count: number }> {
    const pool = getDatabase();
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM clients WHERE keka_id IS NOT NULL AND is_active = true`
    );
    return {
      lastSync: null, // TODO: Use sync_runs table for last sync info
      count: parseInt(result.rows[0]?.count || '0', 10),
    };
  }
}

export default KekaClientsSyncService;
