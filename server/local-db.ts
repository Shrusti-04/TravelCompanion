import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "travel_app4",
  // Enable connection pooling for better performance
  connectionLimit: 10,
});

// Create and export the Drizzle database instance
export const db = drizzle(pool, { schema });
