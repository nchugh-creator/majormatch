const { Pool } = require('pg');

// Reuse pool across warm serverless invocations
let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured. Add it in Vercel → Settings → Environment Variables.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1, // keep connections minimal for serverless
    });
  }
  return pool;
}

module.exports = { getPool };
