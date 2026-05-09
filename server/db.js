const { Pool } = require('pg');

// If DATABASE_URL is missing (e.g. env vars not yet configured),
// export a stub pool that returns a friendly error instead of crashing.
if (!process.env.DATABASE_URL) {
  module.exports = {
    query: () => Promise.reject(new Error('DATABASE_URL not configured')),
    connect: () => Promise.reject(new Error('DATABASE_URL not configured')),
  };
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  module.exports = pool;
}
