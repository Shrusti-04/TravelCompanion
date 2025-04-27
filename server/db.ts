import { drizzle } from 'drizzle-orm/better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Use SQLite for development on Replit
const sqlite = new Database('sqlite.db');
export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, { schema });
