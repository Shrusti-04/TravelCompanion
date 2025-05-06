import mysql from "mysql2/promise";

async function setupTables() {
  console.log("Setting up database...");
  // First connect without database to create it
  const rootConnection = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
  });
  await rootConnection.query("CREATE DATABASE IF NOT EXISTS travel_app4");
  await rootConnection.end();

  console.log("Setting up database tables...");
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "travel_app4",
  });

  // Create all necessary tables
  // Users table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      name VARCHAR(255),
      avatar VARCHAR(255)
    );
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
      FOREIGN KEY (userId) REFERENCES users(id)
    );
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
      FOREIGN KEY (tripId) REFERENCES trips(id)
    );
  `);

  // Packing items table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS packing_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tripId INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      quantity INT DEFAULT 1,
      packed BOOLEAN DEFAULT false,
      FOREIGN KEY (tripId) REFERENCES trips(id)
    );
  `);

  console.log("Database setup complete!");
  await connection.end();
}

setupTables().catch(console.error);
