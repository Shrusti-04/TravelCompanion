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
import { eq, and, inArray, desc, asc, gte, lte, sql } from "drizzle-orm";
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
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

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
    const result = await db.insert(users).values(insertUser);
    // For SQLite, the last id will be returned immediately
    const userId = db.get(sql`SELECT last_insert_rowid() as id`).id;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  // Trip operations
  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getTripsByUser(userId: number): Promise<Trip[]> {
    const userTrips = await db
      .select()
      .from(trips)
      .where(eq(trips.userId, userId))
      .orderBy(desc(trips.startDate));
    
    return userTrips;
  }

  async getSharedTrips(userId: number): Promise<Trip[]> {
    const tripIds = await db
      .select({ tripId: tripMembers.tripId })
      .from(tripMembers)
      .where(eq(tripMembers.userId, userId));
    
    if (tripIds.length === 0) {
      return [];
    }
    
    const tripIdArr = tripIds.map(t => t.tripId);
    
    const sharedTrips = await db
      .select()
      .from(trips)
      .where(inArray(trips.id, tripIdArr))
      .orderBy(desc(trips.startDate));
    
    return sharedTrips;
  }

  async createTrip(trip: InsertTrip & { userId: number }): Promise<Trip> {
    const result = await db.insert(trips).values({
      name: trip.name,
      userId: trip.userId,
      destination: trip.destination,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      imageUrl: trip.imageUrl,
      description: trip.description,
      isShared: trip.isShared ?? false
    });
    
    const tripId = db.get(sql`SELECT last_insert_rowid() as id`).id;
    const [newTrip] = await db.select().from(trips).where(eq(trips.id, tripId));
    return newTrip;
  }

  async updateTrip(id: number, tripData: Partial<InsertTrip>): Promise<Trip> {
    // Convert Date objects to ISO strings for SQLite storage
    let updatedData: any = {...tripData};
    if (tripData.startDate) {
      updatedData.startDate = tripData.startDate.toISOString();
    }
    if (tripData.endDate) {
      updatedData.endDate = tripData.endDate.toISOString();
    }
    
    await db.update(trips).set(updatedData).where(eq(trips.id, id));
    const [updatedTrip] = await db.select().from(trips).where(eq(trips.id, id));
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
    const scheduleItems = await db
      .select()
      .from(schedules)
      .where(eq(schedules.tripId, tripId))
      .orderBy(asc(schedules.day), asc(schedules.time));
    
    return scheduleItems;
  }

  async getSchedulesByUser(userId: number): Promise<Schedule[]> {
    const userTrips = await this.getTripsByUser(userId);
    if (userTrips.length === 0) {
      return [];
    }
    
    const tripIds = userTrips.map(trip => trip.id);
    
    const scheduleItems = await db
      .select()
      .from(schedules)
      .where(inArray(schedules.tripId, tripIds))
      .orderBy(asc(schedules.day), asc(schedules.time));
    
    return scheduleItems;
  }

  async getSchedulesByDate(date: Date): Promise<Schedule[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    const scheduleItems = await db
      .select()
      .from(schedules)
      .where(eq(schedules.day, dateStr))
      .orderBy(asc(schedules.time));
    
    return scheduleItems;
  }

  async createSchedule(schedule: InsertSchedule & { tripId: number }): Promise<Schedule> {
    const scheduleData = {
      ...schedule,
      day: schedule.day.toISOString().split('T')[0], // Store as "YYYY-MM-DD"
      tripId: schedule.tripId
    };
    
    const result = await db.insert(schedules).values(scheduleData);
    const scheduleId = db.get(sql`SELECT last_insert_rowid() as id`).id;
    const [newSchedule] = await db.select().from(schedules).where(eq(schedules.id, scheduleId));
    return newSchedule;
  }

  async updateSchedule(id: number, scheduleData: Partial<InsertSchedule>): Promise<Schedule> {
    let updatedData: any = {...scheduleData};
    if (scheduleData.day) {
      updatedData.day = scheduleData.day.toISOString().split('T')[0];
    }
    
    await db.update(schedules).set(updatedData).where(eq(schedules.id, id));
    const [updatedSchedule] = await db.select().from(schedules).where(eq(schedules.id, id));
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
    const items = await db
      .select()
      .from(packingItems)
      .where(eq(packingItems.tripId, tripId))
      .orderBy(asc(packingItems.categoryId), asc(packingItems.name));
    
    return items;
  }

  async getPackingItemsByUser(userId: number): Promise<PackingItem[]> {
    const userTrips = await this.getTripsByUser(userId);
    if (userTrips.length === 0) {
      return [];
    }
    
    const tripIds = userTrips.map(trip => trip.id);
    
    const items = await db
      .select()
      .from(packingItems)
      .where(inArray(packingItems.tripId, tripIds))
      .orderBy(asc(packingItems.categoryId), asc(packingItems.name));
    
    return items;
  }

  async createPackingItem(item: InsertPackingItem & { tripId: number }): Promise<PackingItem> {
    const result = await db.insert(packingItems).values({
      name: item.name,
      tripId: item.tripId,
      categoryId: item.categoryId,
      quantity: item.quantity,
      isPacked: false
    });
    
    const itemId = db.get(sql`SELECT last_insert_rowid() as id`).id;
    const [newItem] = await db.select().from(packingItems).where(eq(packingItems.id, itemId));
    return newItem;
  }

  async updatePackingItem(id: number, itemData: Partial<InsertPackingItem & { isPacked: boolean }>): Promise<PackingItem> {
    await db.update(packingItems).set(itemData).where(eq(packingItems.id, id));
    const [updatedItem] = await db.select().from(packingItems).where(eq(packingItems.id, id));
    return updatedItem;
  }

  async deletePackingItem(id: number): Promise<void> {
    await db.delete(packingItems).where(eq(packingItems.id, id));
  }

  // Packing categories operations
  async getPackingCategories(): Promise<PackingCategory[]> {
    const categories = await db
      .select()
      .from(packingCategories)
      .orderBy(asc(packingCategories.name));
    
    return categories;
  }

  async getPackingCategory(id: number): Promise<PackingCategory | undefined> {
    const [category] = await db.select().from(packingCategories).where(eq(packingCategories.id, id));
    return category;
  }

  async createPackingCategory(category: { name: string; color: string }): Promise<PackingCategory> {
    const result = await db.insert(packingCategories).values(category);
    const categoryId = db.get(sql`SELECT last_insert_rowid() as id`).id;
    const [newCategory] = await db.select().from(packingCategories).where(eq(packingCategories.id, categoryId));
    return newCategory;
  }

  // Trip tags operations
  async getTripTags(tripId: number): Promise<TripTag[]> {
    const tags = await db
      .select()
      .from(tripTags)
      .where(eq(tripTags.tripId, tripId));
    
    return tags;
  }

  async createTripTag(tag: { tripId: number; name: string; color: string }): Promise<TripTag> {
    const result = await db.insert(tripTags).values(tag);
    const tagId = db.get(sql`SELECT last_insert_rowid() as id`).id;
    const [newTag] = await db.select().from(tripTags).where(eq(tripTags.id, tagId));
    return newTag;
  }

  async deleteTripTag(id: number): Promise<void> {
    await db.delete(tripTags).where(eq(tripTags.id, id));
  }

  // Trip members operations
  async getTripMembers(tripId: number): Promise<TripMember[]> {
    const members = await db
      .select()
      .from(tripMembers)
      .where(eq(tripMembers.tripId, tripId));
    
    return members;
  }

  async addTripMember(tripMember: { tripId: number; userId: number; role: string }): Promise<TripMember> {
    const result = await db.insert(tripMembers).values(tripMember);
    const memberId = db.get(sql`SELECT last_insert_rowid() as id`).id;
    const [newMember] = await db.select().from(tripMembers).where(eq(tripMembers.id, memberId));
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
    const timestamp = new Date().toISOString();
    const result = await db
      .insert(weatherCache)
      .values({
        location,
        data,
        timestamp
      });
    
    const cacheId = db.get(sql`SELECT last_insert_rowid() as id`).id;
    const [cache] = await db.select().from(weatherCache).where(eq(weatherCache.id, cacheId));
    return cache;
  }
}

export const storage = new DatabaseStorage();