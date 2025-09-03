#!/usr/bin/env node

// Simple debug script to test deployment environment
console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
console.log('REPLIT_DOMAINS exists:', !!process.env.REPLIT_DOMAINS);
console.log('REPL_ID exists:', !!process.env.REPL_ID);

// Test database connection
try {
  const { Pool } = await import('@neondatabase/serverless');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  console.log('Database connection: SUCCESS');
  await client.query('SELECT 1');
  console.log('Database query test: SUCCESS');
  client.release();
} catch (error) {
  console.log('Database connection: FAILED');
  console.error('Database error:', error.message);
}

console.log('Debug test complete');