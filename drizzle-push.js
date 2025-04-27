// Simple script to push the schema to the SQLite database
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite);

console.log('Creating database tables...');

// We'll use a simple schema creation approach
sqlite.exec(`
  -- Drop existing tables
  DROP TABLE IF EXISTS weather_cache;
  DROP TABLE IF EXISTS trip_members;
  DROP TABLE IF EXISTS packing_items;
  DROP TABLE IF EXISTS packing_categories;
  DROP TABLE IF EXISTS schedules;
  DROP TABLE IF EXISTS trip_tags;
  DROP TABLE IF EXISTS trips;
  DROP TABLE IF EXISTS users;

  -- Create tables
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
  );

  CREATE TABLE trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    image_url TEXT,
    description TEXT,
    is_shared INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE trip_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id),
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id),
    day TEXT NOT NULL,
    title TEXT NOT NULL,
    time TEXT,
    location TEXT,
    description TEXT
  );

  CREATE TABLE packing_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE packing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id),
    category_id INTEGER REFERENCES packing_categories(id),
    name TEXT NOT NULL,
    is_packed INTEGER NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE trip_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    role TEXT NOT NULL DEFAULT 'viewer'
  );

  CREATE TABLE weather_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );
  
  -- Create default packing categories
  INSERT INTO packing_categories (name, color) VALUES 
    ('Clothing', '#ff5733'),
    ('Toiletries', '#33ff57'),
    ('Electronics', '#3357ff'),
    ('Documents', '#ff33f5'),
    ('Miscellaneous', '#33f5ff');
`);

console.log('Database tables created successfully!');