import { pgTable, text, serial, integer, boolean, date, timestamp, foreignKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
});

// Trips table
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  destination: text("destination").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  isShared: boolean("is_shared").default(false).notNull(),
});

// Trip tags table
export const tripTags = pgTable("trip_tags", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// Trip schedules table
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  day: date("day").notNull(),
  title: text("title").notNull(),
  time: text("time"),
  location: text("location"),
  description: text("description"),
});

// Packing list categories
export const packingCategories = pgTable("packing_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// Packing list items
export const packingItems = pgTable("packing_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  categoryId: integer("category_id").references(() => packingCategories.id),
  name: text("name").notNull(),
  isPacked: boolean("is_packed").default(false).notNull(),
  quantity: integer("quantity").default(1).notNull(),
});

// Trip members (for sharing)
export const tripMembers = pgTable("trip_members", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").default("viewer").notNull(), // viewer, editor, owner
});

// Weather data cache
export const weatherCache = pgTable("weather_cache", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  data: text("data").notNull(), // JSON string
  timestamp: timestamp("timestamp").notNull(),
});

// Schema validation for user insertion
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
}).omit({ id: true });

// Schema validation for trip insertion
export const insertTripSchema = createInsertSchema(trips, {
  name: z.string().min(3, "Trip name must be at least 3 characters"),
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).omit({ id: true, userId: true });

// Schema validation for schedule insertion
export const insertScheduleSchema = createInsertSchema(schedules, {
  day: z.coerce.date(),
  title: z.string().min(2, "Title must be at least 2 characters"),
}).omit({ id: true });

// Schema validation for packing item insertion
export const insertPackingItemSchema = createInsertSchema(packingItems, {
  name: z.string().min(2, "Item name must be at least 2 characters"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
}).omit({ id: true, isPacked: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type PackingCategory = typeof packingCategories.$inferSelect;
export type PackingItem = typeof packingItems.$inferSelect;
export type InsertPackingItem = z.infer<typeof insertPackingItemSchema>;

export type TripMember = typeof tripMembers.$inferSelect;
export type TripTag = typeof tripTags.$inferSelect;
export type WeatherCache = typeof weatherCache.$inferSelect;
