import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertTripSchema, 
  insertScheduleSchema, 
  insertPackingItemSchema,
  Trip,
  Schedule,
  PackingItem,
  PackingCategory,
  TripTag,
  TripMember
} from "@shared/schema";
import { getWeatherForLocation, getNextTripWeather } from "./weather";

// Helper function to ensure user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Trips API routes
  app.get("/api/trips", isAuthenticated, async (req, res) => {
    try {
      const trips = await storage.getTripsByUser(req.user!.id);
      res.json(trips);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trips/:id", isAuthenticated, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip or is a member
      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(tripId);
        const isMember = members.some(member => member.userId === req.user!.id);
        
        if (!isMember) {
          return res.status(403).json({ message: "Not authorized to view this trip" });
        }
      }

      res.json(trip);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/trips", isAuthenticated, async (req, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      const newTrip = await storage.createTrip({
        ...tripData,
        userId: req.user!.id
      });
      res.status(201).json(newTrip);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/trips/:id", isAuthenticated, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip
      if (trip.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this trip" });
      }

      const tripData = insertTripSchema.partial().parse(req.body);
      const updatedTrip = await storage.updateTrip(tripId, tripData);
      res.json(updatedTrip);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/trips/:id", isAuthenticated, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip
      if (trip.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this trip" });
      }

      await storage.deleteTrip(tripId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Schedules API routes
  app.get("/api/schedules", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByUser(req.user!.id);
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trips/:id/schedules", isAuthenticated, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip or is a member
      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(tripId);
        const isMember = members.some(member => member.userId === req.user!.id);
        
        if (!isMember) {
          return res.status(403).json({ message: "Not authorized to view this trip's schedules" });
        }
      }

      const schedules = await storage.getSchedulesByTrip(tripId);
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/trips/:id/schedules", isAuthenticated, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip or has editor role
      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(tripId);
        const isEditor = members.some(member => 
          member.userId === req.user!.id && 
          (member.role === "editor" || member.role === "owner")
        );
        
        if (!isEditor) {
          return res.status(403).json({ message: "Not authorized to add schedules to this trip" });
        }
      }

      const scheduleData = insertScheduleSchema.parse(req.body);
      const newSchedule = await storage.createSchedule({
        ...scheduleData,
        tripId
      });
      res.status(201).json(newSchedule);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const schedule = await storage.getSchedule(scheduleId);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Check if user owns the trip this schedule belongs to
      const trip = await storage.getTrip(schedule.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(trip.id);
        const isEditor = members.some(member => 
          member.userId === req.user!.id && 
          (member.role === "editor" || member.role === "owner")
        );
        
        if (!isEditor) {
          return res.status(403).json({ message: "Not authorized to update this schedule" });
        }
      }

      const scheduleData = insertScheduleSchema.partial().parse(req.body);
      const updatedSchedule = await storage.updateSchedule(scheduleId, scheduleData);
      res.json(updatedSchedule);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const schedule = await storage.getSchedule(scheduleId);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Check if user owns the trip this schedule belongs to
      const trip = await storage.getTrip(schedule.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(trip.id);
        const isEditor = members.some(member => 
          member.userId === req.user!.id && 
          (member.role === "editor" || member.role === "owner")
        );
        
        if (!isEditor) {
          return res.status(403).json({ message: "Not authorized to delete this schedule" });
        }
      }

      await storage.deleteSchedule(scheduleId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Packing items API routes
  app.get("/api/packing-items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getPackingItemsByUser(req.user!.id);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trips/:id/packing-items", isAuthenticated, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip or is a member
      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(tripId);
        const isMember = members.some(member => member.userId === req.user!.id);
        
        if (!isMember) {
          return res.status(403).json({ message: "Not authorized to view this trip's packing items" });
        }
      }

      const items = await storage.getPackingItemsByTrip(tripId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/trips/:id/packing-items", isAuthenticated, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip or has editor role
      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(tripId);
        const isEditor = members.some(member => 
          member.userId === req.user!.id && 
          (member.role === "editor" || member.role === "owner")
        );
        
        if (!isEditor) {
          return res.status(403).json({ message: "Not authorized to add packing items to this trip" });
        }
      }

      const itemData = insertPackingItemSchema.parse(req.body);
      const newItem = await storage.createPackingItem({
        ...itemData,
        tripId
      });
      res.status(201).json(newItem);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/packing-items/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getPackingItem(itemId);

      if (!item) {
        return res.status(404).json({ message: "Packing item not found" });
      }

      // Check if user owns the trip this item belongs to
      const trip = await storage.getTrip(item.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(trip.id);
        const isEditor = members.some(member => 
          member.userId === req.user!.id && 
          (member.role === "editor" || member.role === "owner")
        );
        
        if (!isEditor) {
          return res.status(403).json({ message: "Not authorized to update this packing item" });
        }
      }

      // Allow updating isPacked status separately
      const updateData = {
        ...insertPackingItemSchema.partial().parse(req.body),
        ...(req.body.isPacked !== undefined ? { isPacked: req.body.isPacked } : {})
      };
      
      const updatedItem = await storage.updatePackingItem(itemId, updateData);
      res.json(updatedItem);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/packing-items/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getPackingItem(itemId);

      if (!item) {
        return res.status(404).json({ message: "Packing item not found" });
      }

      // Check if user owns the trip this item belongs to
      const trip = await storage.getTrip(item.tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(trip.id);
        const isEditor = members.some(member => 
          member.userId === req.user!.id && 
          (member.role === "editor" || member.role === "owner")
        );
        
        if (!isEditor) {
          return res.status(403).json({ message: "Not authorized to delete this packing item" });
        }
      }

      await storage.deletePackingItem(itemId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Packing categories API routes
  app.get("/api/packing-categories", async (req, res) => {
    try {
      const categories = await storage.getPackingCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Trip tags API routes
  app.get("/api/trip-tags", isAuthenticated, async (req, res) => {
    try {
      // Get all trips for the user
      const userTrips = await storage.getTripsByUser(req.user!.id);
      
      // Get tags for each trip
      const allTags: TripTag[] = [];
      for (const trip of userTrips) {
        const tripTags = await storage.getTripTags(trip.id);
        allTags.push(...tripTags);
      }
      
      res.json(allTags);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trips/:id/tags", isAuthenticated, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip or is a member
      if (trip.userId !== req.user!.id) {
        const members = await storage.getTripMembers(tripId);
        const isMember = members.some(member => member.userId === req.user!.id);
        
        if (!isMember) {
          return res.status(403).json({ message: "Not authorized to view this trip's tags" });
        }
      }

      const tags = await storage.getTripTags(tripId);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Shared trips API routes
  app.get("/api/shared-trips", isAuthenticated, async (req, res) => {
    try {
      const sharedTrips = await storage.getSharedTrips(req.user!.id);
      res.json(sharedTrips);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Trip sharing API routes
  app.post("/api/trips/:id/share", isAuthenticated, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip
      if (trip.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to share this trip" });
      }

      const { username, role = "viewer" } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      // Find the user to share with
      const shareWithUser = await storage.getUserByUsername(username);
      if (!shareWithUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't allow sharing with self
      if (shareWithUser.id === req.user!.id) {
        return res.status(400).json({ message: "Cannot share trip with yourself" });
      }

      // Check if trip is already shared with this user
      const members = await storage.getTripMembers(tripId);
      const alreadyShared = members.some(member => member.userId === shareWithUser.id);
      
      if (alreadyShared) {
        return res.status(400).json({ message: "Trip already shared with this user" });
      }

      // Mark trip as shared
      if (!trip.isShared) {
        await storage.updateTrip(tripId, { isShared: true });
      }

      // Add member to trip
      const tripMember = await storage.addTripMember({
        tripId,
        userId: shareWithUser.id,
        role
      });

      res.status(201).json(tripMember);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Weather API routes
  app.get("/api/weather/:location", isAuthenticated, async (req, res) => {
    try {
      const location = req.params.location;
      const weather = await getWeatherForLocation(location);
      res.json(weather);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/weather/next-trip", isAuthenticated, async (req, res) => {
    try {
      const weather = await getNextTripWeather(req.user!.id);
      if (!weather) {
        return res.status(404).json({ message: "No upcoming trips found" });
      }
      res.json(weather);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
