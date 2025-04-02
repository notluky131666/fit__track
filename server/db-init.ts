// Database initialization function for PostgreSQL
import * as fs from 'fs';
import * as path from 'path';
import pool from './pg-connection';

// Initialize database tables and setup
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('Database initialization starting...');
    
    // Check if tables exist first
    const tablesExist = await checkTablesExist();
    
    if (tablesExist) {
      console.log('Database tables already exist, skipping initialization.');
      return true;
    }
    
    console.log('Creating database tables...');
    
    // Read the SQL setup file
    const sqlSetupPath = path.join(process.cwd(), 'supabase-setup.sql');
    let sqlSetup = fs.readFileSync(sqlSetupPath, 'utf8');
    
    // Execute the SQL setup script
    await pool.query(sqlSetup);
    
    console.log('Database tables created successfully.');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Check if tables already exist
async function checkTablesExist(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking if tables exist:', error);
    return false;
  }
}