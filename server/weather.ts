import fetch from "node-fetch";
import { storage } from "./storage";

// Weather data interface
interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  date: string;
  icon: string;
}

/**
 * Get weather data for a specific location
 * Uses OpenWeatherMap API
 */
export async function getWeatherForLocation(location: string): Promise<WeatherData> {
  try {
    // Check if we have a cached version
    const cachedWeather = await storage.getWeatherCache(location);
    const cacheTime = 30 * 60 * 1000; // 30 minutes

    // If cache is less than 30 minutes old, use it
    if (cachedWeather && (new Date().getTime() - new Date(cachedWeather.timestamp).getTime() < cacheTime)) {
      return JSON.parse(cachedWeather.data);
    }

    // Get fresh data from OpenWeatherMap API
    const apiKey = process.env.OPENWEATHER_API_KEY || "placeholder_key";
    
    // Add fallback for empty or invalid locations
    const safeLocation = location && location.trim() ? location : "London";
    
    console.log(`Fetching weather for location: "${safeLocation}" with API key length: ${apiKey.length}`);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(safeLocation)}&units=metric&appid=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Weather API error: Status=${response.status}, URL=${url.replace(apiKey, "API_KEY_HIDDEN")}`);
      throw new Error(`Weather API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json() as any;

    // Format the response
    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      location: data.name,
      date: new Date().toISOString().split('T')[0],
      icon: data.weather[0].icon
    };

    // Cache the result
    await storage.saveWeatherCache(location, JSON.stringify(weatherData));

    return weatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    
    // Return placeholder data if API call fails
    return {
      temperature: 25,
      condition: "Unknown",
      location,
      date: new Date().toISOString().split('T')[0],
      icon: "01d"
    };
  }
}

/**
 * Get weather for the next upcoming trip
 */
export async function getNextTripWeather(userId: number): Promise<WeatherData | null> {
  try {
    // Get user's trips, sorted by start date (ascending)
    const trips = await storage.getTripsByUser(userId);
    if (!trips.length) return null;

    // Sort trips by start date
    const sortedTrips = [...trips].sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // Find the next trip (first trip with start date in the future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextTrip = sortedTrips.find(trip => {
      const startDate = new Date(trip.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    });

    if (!nextTrip) return null;

    // Get weather for the trip destination
    return await getWeatherForLocation(nextTrip.destination);
  } catch (error) {
    console.error("Error getting next trip weather:", error);
    return null;
  }
}

/**
 * Get forecast for the next 7 days for a location
 */
export async function getForecast(location: string): Promise<WeatherData[]> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY || "placeholder_key";
    
    // Add fallback for empty or invalid locations
    const safeLocation = location && location.trim() ? location : "London";
    
    console.log(`Fetching forecast for location: "${safeLocation}" with API key length: ${apiKey.length}`);
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(safeLocation)}&units=metric&appid=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Weather API error: Status=${response.status}, URL=${url.replace(apiKey, "API_KEY_HIDDEN")}`);
      throw new Error(`Weather API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json() as any;
    
    // Process the forecast data (OpenWeatherMap returns forecast in 3-hour intervals)
    // Group by day and take the data for noon
    const forecastByDay = new Map<string, any>();
    
    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0];
      const time = item.dt_txt.split(' ')[1];
      
      // Take the forecast for noon or the first available time slot for each day
      if (time === '12:00:00' || !forecastByDay.has(date)) {
        forecastByDay.set(date, item);
      }
    }

    // Format the response for each day
    const forecast: WeatherData[] = [];
    for (const [date, item] of forecastByDay.entries()) {
      forecast.push({
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].main,
        location: data.city.name,
        date,
        icon: item.weather[0].icon
      });
    }

    return forecast;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    
    // Return empty array if API call fails
    return [];
  }
}
