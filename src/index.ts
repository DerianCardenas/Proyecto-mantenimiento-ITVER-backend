// ============================================================
// Application Entry Point
// ============================================================

import app from './app';
import { pool } from './config/database';
import './config/s3'; // Initialize S3 client

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  try {
    // Verify database connection
    const client = await pool.connect();
    console.log('[DB] Connected successfully');
    client.release();

    app.listen(PORT, () => {
      console.log(`[SERVER] SGM-ITVER Backend running on http://localhost:${PORT}`);
      console.log(`[API]  http://localhost:${PORT}/api`);
      console.log(`[HEALTH] http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err);
    process.exit(1);
  }
}

start();
