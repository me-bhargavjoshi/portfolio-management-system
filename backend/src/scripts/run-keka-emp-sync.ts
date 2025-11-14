import 'dotenv/config';
import { initDatabase } from '../config/database';
import { KekaEmployeesSyncService } from '../integrations/keka-employees-sync';

async function main() {
  const pool = await initDatabase();

  try {
    // Get a company to associate the employees with
    const r = await pool.query('SELECT id, name FROM companies ORDER BY created_at DESC LIMIT 1');
    if (r.rows.length === 0) {
      console.error('No company found in database. Create a company first.');
      process.exit(1);
    }

    const company = r.rows[0];
    console.log(`Using company: ${company.id} (${company.name})`);

    const svc = new KekaEmployeesSyncService();
    const result = await svc.syncEmployees(company.id);

    console.log('Sync result:', JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('Error running sync script:', err?.message || err);
    process.exit(2);
  } finally {
    // allow pool to drain
    setTimeout(() => process.exit(0), 500);
  }
}

main();
