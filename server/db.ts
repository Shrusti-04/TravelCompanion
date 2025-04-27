import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

// MySQL database configuration with hardcoded credentials as specified
const dbCredentials = {
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "travel_app3",
  // Add these additional configuration options for better compatibility
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
export const pool = mysql.createPool(dbCredentials);
export const db = drizzle(pool, { schema, mode: 'default' });
