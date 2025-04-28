import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

// MySQL configuration for local development
export async function getMySQLDB() {
  // Create the MySQL pool
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'travel_app3'
  });
  
  // Return the drizzle instance
  return drizzle(pool, { schema });
}