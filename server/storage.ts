import { 
  users, 
  trips, 
  schedules, 
  packingItems, 
  packingCategories, 
  tripTags, 
  tripMembers, 
  weatherCache,
  type User, 
  type InsertUser, 
  type Trip, 
  type InsertTrip,
  type Schedule,
  type InsertSchedule,
  type PackingItem,
  type InsertPackingItem,
  type PackingCategory,
  type TripTag,
  type TripMember,
  type WeatherCache
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, asc, gte, lte } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Trip operations
  getTrip(id: number): Promise<Trip | undefined>;
  getTripsByUser(userId: number): Promise<Trip[]>;
  getSharedTrips(userId: number): Promise<Trip[]>;
  createTrip(trip: InsertTrip & { userId: number }): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;

  // Schedule operations
  getSchedule(id: number): Promise<Schedule | undefined>;
  getSchedulesByTrip(tripId: number): Promise<Schedule[]>;
  getSchedulesByUser(userId: number): Promise<Schedule[]>;
  getSchedulesByDate(date: Date): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule & { tripId: number }): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;

  // Packing items operations
  getPackingItem(id: number): Promise<PackingItem | undefined>;
  getPackingItemsByTrip(tripId: number): Promise<PackingItem[]>;
  getPackingItemsByUser(userId: number): Promise<PackingItem[]>;
  createPackingItem(item: InsertPackingItem & { tripId: number }): Promise<PackingItem>;
  updatePackingItem(id: number, item: Partial<InsertPackingItem & { isPacked: boolean }>): Promise<PackingItem>;
  deletePackingItem(id: number): Promise<void>;

  // Packing categories operations
  getPackingCategories(): Promise<PackingCategory[]>;
  getPackingCategory(id: number): Promise<PackingCategory | undefined>;
  createPackingCategory(category: { name: string; color: string }): Promise<PackingCategory>;

  // Trip tags operations
  getTripTags(tripId: number): Promise<TripTag[]>;
  createTripTag(tag: { tripId: number; name: string; color: string }): Promise<TripTag>;
  deleteTripTag(id: number): Promise<void>;

  // Trip members operations
  getTripMembers(tripId: number): Promise<TripMember[]>;
  addTripMember(tripMember: { tripId: number; userId: number; role: string }): Promise<TripMember>;
  removeTripMember(tripId: number, userId: number): Promise<void>;

  // Weather cache operations
  getWeatherCache(location: string): Promise<WeatherCache | undefined>;
  saveWeatherCache(location: string, data: string): Promise<WeatherCache>;

  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24 hours
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Trip operations
  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getTripsByUser(userId: number): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.userId, userId));
  }

  async getSharedTrips(userId: number): Promise<Trip[]> {
    const sharedTripIds = await db
      .select({ tripId: tripMembers.tripId })
      .from(tripMembers)
      .where(eq(tripMembers.userId, userId));
    
    if (sharedTripIds.length === 0) return [];
    
    return await db
      .select()
      .from(trips)
      .where(inArray(trips.id, sharedTripIds.map(t => t.tripId)));
  }

  async createTrip(trip: InsertTrip & { userId: number }): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async updateTrip(id: number, tripData: Partial<InsertTrip>): Promise<Trip> {
    const [updatedTrip] = await db
      .update(trips)
      .set(tripData)
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip;
  }

  async deleteTrip(id: number): Promise<void> {
    await db.delete(trips).where(eq(trips.id, id));
  }

  // Schedule operations
  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule;
  }

  async getSchedulesByTrip(tripId: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.tripId, tripId))
      .orderBy(asc(schedules.day), asc(schedules.time));
  }

  async getSchedulesByUser(userId: number): Promise<Schedule[]> {
    const userTrips = await this.getTripsByUser(userId);
    const tripIds = userTrips.map(trip => trip.id);
    
    if (tripIds.length === 0) return [];
    
    return await db
      .select()
      .from(schedules)
      .where(inArray(schedules.tripId, tripIds))
      .orderBy(asc(schedules.day), asc(schedules.time));
  }

  async getSchedulesByDate(date: Date): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.day, date))
      .orderBy(asc(schedules.time));
  }

  async createSchedule(schedule: InsertSchedule & { tripId: number }): Promise<Schedule> {
    const [newSchedule] = await db.insert(schedules).values(schedule).returning();
    return newSchedule;
  }

  async updateSchedule(id: number, scheduleData: Partial<InsertSchedule>): Promise<Schedule> {
    const [updatedSchedule] = await db
      .update(schedules)
      .set(scheduleData)
      .where(eq(schedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  // Packing items operations
  async getPackingItem(id: number): Promise<PackingItem | undefined> {
    const [item] = await db.select().from(packingItems).where(eq(packingItems.id, id));
    return item;
  }

  async getPackingItemsByTrip(tripId: number): Promise<PackingItem[]> {
    return await db
      .select()
      .from(packingItems)
      .where(eq(packingItems.tripId, tripId));
  }

  async getPackingItemsByUser(userId: number): Promise<PackingItem[]> {
    const userTrips = await this.getTripsByUser(userId);
    const tripIds = userTrips.map(trip => trip.id);
    
    if (tripIds.length === 0) return [];
    
    return await db
      .select()
      .from(packingItems)
      .where(inArray(packingItems.tripId, tripIds));
  }

  async createPackingItem(item: InsertPackingItem & { tripId: number }): Promise<PackingItem> {
    const [newItem] = await db.insert(packingItems).values(item).returning();
    return newItem;
  }

  async updatePackingItem(id: number, itemData: Partial<InsertPackingItem & { isPacked: boolean }>): Promise<PackingItem> {
    const [updatedItem] = await db
      .update(packingItems)
      .set(itemData)
      .where(eq(packingItems.id, id))
      .returning();
    return updatedItem;
  }

  async deletePackingItem(id: number): Promise<void> {
    await db.delete(packingItems).where(eq(packingItems.id, id));
  }

  // Packing categories operations
  async getPackingCategories(): Promise<PackingCategory[]> {
    return await db.select().from(packingCategories);
  }

  async getPackingCategory(id: number): Promise<PackingCategory | undefined> {
    const [category] = await db.select().from(packingCategories).where(eq(packingCategories.id, id));
    return category;
  }

  async createPackingCategory(category: { name: string; color: string }): Promise<PackingCategory> {
    const [newCategory] = await db.insert(packingCategories).values(category).returning();
    return newCategory;
  }

  // Trip tags operations
  async getTripTags(tripId: number): Promise<TripTag[]> {
    return await db
      .select()
      .from(tripTags)
      .where(eq(tripTags.tripId, tripId));
  }

  async createTripTag(tag: { tripId: number; name: string; color: string }): Promise<TripTag> {
    const [newTag] = await db.insert(tripTags).values(tag).returning();
    return newTag;
  }

  async deleteTripTag(id: number): Promise<void> {
    await db.delete(tripTags).where(eq(tripTags.id, id));
  }

  // Trip members operations
  async getTripMembers(tripId: number): Promise<TripMember[]> {
    return await db
      .select()
      .from(tripMembers)
      .where(eq(tripMembers.tripId, tripId));
  }

  async addTripMember(tripMember: { tripId: number; userId: number; role: string }): Promise<TripMember> {
    const [newMember] = await db.insert(tripMembers).values(tripMember).returning();
    return newMember;
  }

  async removeTripMember(tripId: number, userId: number): Promise<void> {
    await db
      .delete(tripMembers)
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId)
        )
      );
  }

  // Weather cache operations
  async getWeatherCache(location: string): Promise<WeatherCache | undefined> {
    const [cache] = await db
      .select()
      .from(weatherCache)
      .where(eq(weatherCache.location, location))
      .orderBy(desc(weatherCache.timestamp))
      .limit(1);
    
    return cache;
  }

  async saveWeatherCache(location: string, data: string): Promise<WeatherCache> {
    const [cache] = await db
      .insert(weatherCache)
      .values({
        location,
        data,
        timestamp: new Date()
      })
      .returning();
    
    return cache;
  }
}

export const storage = new DatabaseStorage();
