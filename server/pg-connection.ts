// PostgreSQL connection utility
// Import the Pool class from the pg module
import pkg from 'pg';
const { Pool } = pkg;

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default pool;