# ⚠️ Postgres Connection Issue - Troubleshooting Guide

## Quick Diagnostics

Your Postgres GUI app is installed but isn't accepting connections on `localhost:5432`.

### Check These in Postgres.app GUI:

1. **Open Postgres.app**
   - Look in Applications > Postgres.app
   - Click the icon to open the control panel
   
2. **Verify Server is Running**
   - You should see a green checkmark or "Running" status
   - Port should be **5432**
   - Host should be **localhost** or **127.0.0.1**

3. **Check Connection Settings**
   - Click on the server entry
   - Note the exact host, port, user shown
   - Default is usually:
     - Host: localhost
     - Port: 5432
     - User: postgres
     - Password: (empty or "postgres")

4. **Restart the Server**
   - Stop the server (if running)
   - Click "Start" again
   - Wait 5-10 seconds for it to fully start

---

## Alternative: Use SQLite for MVP Development

If you prefer to skip Postgres setup for now, we can use SQLite (built-in to Node.js):

### Steps:

1. Install better-sqlite3:
   ```bash
   cd /Users/detadmin/Documents/Portfolio\ Management/backend
   npm install better-sqlite3
   npm install --save-dev @types/better-sqlite3
   ```

2. I will create a SQLite config and adapter so the backend works

3. Run smoketests with SQLite backend

---

## Once Postgres is Running

Once you have Postgres running and accepting connections on localhost:5432:

1. Run the database init script:
   ```bash
   cd /Users/detadmin/Documents/Portfolio\ Management/backend
   node scripts/init-db.js
   ```

2. Start the backend:
   ```bash
   npm run dev
   ```

3. Run smoke tests in another terminal

---

## Next Steps from You

Please tell me:

1. **Can you connect to Postgres from Postgres.app GUI?**
   - Try: Open Postgres.app, click the server, check status
   
2. **Would you prefer to use SQLite for now?**
   - Yes → I'll set up SQLite and we continue testing immediately
   - No → Fix Postgres connection first, then we resume

Let me know what works best!
