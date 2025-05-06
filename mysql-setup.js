const mysql = require("mysql2/promise");

async function setupDatabase() {
  try {
    // First connect without database to create it
    const connection = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
    });

    console.log("Creating database...");
    await connection.query("CREATE DATABASE IF NOT EXISTS travel_app3");
    await connection.end();

    // Connect with database selected
    const dbConnection = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "travel_app4",
    });

    console.log("Creating tables...");

    // Create users table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL
      )
    `);

    // Create trips table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        description TEXT,
        is_shared BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create schedules table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trip_id INT NOT NULL,
        day DATETIME NOT NULL,
        time VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        description TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      )
    `);

    // Create packing categories table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS packing_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) NOT NULL DEFAULT '#888888'
      )
    `);

    // Create packing items table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS packing_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trip_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        category_id INT,
        quantity INT DEFAULT 1,
        is_packed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (trip_id) REFERENCES trips(id),
        FOREIGN KEY (category_id) REFERENCES packing_categories(id)
      )
    `);

    // Create a test user with password 'testpass'
    await dbConnection.query(`
      INSERT INTO users (username, password, email, name)
      VALUES ('testuser', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.AhknXQGp4v3y4Q5./4XhXvLnHUVulAS', 'test@example.com', 'Test User')
      ON DUPLICATE KEY UPDATE username=username
    `);

    console.log("Database setup complete!");
    await dbConnection.end();
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
const fs = require("fs");
const path = require("path");

async function setupMySQL() {
  try {
    // Create the connection to MySQL server
    const connection = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
    });

    console.log("Connected to MySQL server");

    // Create database if it doesn't exist
    await connection.execute("CREATE DATABASE IF NOT EXISTS travel_app3");
    console.log("Database travel_app3 created or confirmed existing");

    // Use the database
    await connection.execute("USE travel_app3");

    // Create tables using SQL statements based on your schema
    console.log("Creating tables...");

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        avatar VARCHAR(255)
      )
    `);

    // Trips table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        destination VARCHAR(255),
        startDate DATETIME,
        endDate DATETIME,
        description TEXT,
        image VARCHAR(255),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Schedules table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tripId INT NOT NULL,
        day DATETIME NOT NULL,
        time VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        description TEXT,
        FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE
      )
    `);

    // Packing categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS packing_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) NOT NULL
      )
    `);

    // Packing items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS packing_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tripId INT NOT NULL,
        categoryId INT,
        name VARCHAR(255) NOT NULL,
        quantity INT DEFAULT 1,
        isPacked BOOLEAN DEFAULT false,
        FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES packing_categories(id) ON DELETE SET NULL
      )
    `);

    // Trip tags table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trip_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tripId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) NOT NULL,
        FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE
      )
    `);

    // Trip members table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trip_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tripId INT NOT NULL,
        userId INT NOT NULL,
        role VARCHAR(50) NOT NULL,
        FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Weather cache table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS weather_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        location VARCHAR(255) NOT NULL UNIQUE,
        data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add default packing categories
    await connection.execute(`
      INSERT IGNORE INTO packing_categories (name, color) VALUES
      ('Clothing', '#FF5733'),
      ('Toiletries', '#33FF57'),
      ('Electronics', '#3357FF'),
      ('Documents', '#F3FF33'),
      ('Miscellaneous', '#FF33F6')
    `);

    console.log("All tables created successfully");

    // Create database session store
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) NOT NULL,
        expires INT UNSIGNED NOT NULL,
        data MEDIUMTEXT,
        PRIMARY KEY (session_id)
      )
    `);

    console.log("Session store created");

    await connection.end();
    console.log("MySQL setup completed successfully");
  } catch (error) {
    console.error("Error setting up MySQL:", error);
    process.exit(1);
  }
}

setupMySQL();
