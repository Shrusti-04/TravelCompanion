import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { WeatherCard } from "@/components/ui/weather-card";
import { TripCard } from "@/components/ui/trip-card";
import { CreateTripDialog } from "@/components/create-trip-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Plus } from "lucide-react";
import { Trip, TripTag } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const [createTripOpen, setCreateTripOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [forecastOpen, setForecastOpen] = useState(false);
  const [forecastLocation, setForecastLocation] = useState("");

  // Fetch trips
  const { data: trips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips'],
  });

  // Fetch trip tags
  const { data: tags = [], isLoading: tagsLoading } = useQuery<TripTag[]>({
    queryKey: ['/api/trip-tags'],
  });

  // Fetch weather for the next trip
  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['/api/weather/next-trip'],
    enabled: trips.length > 0,
  });
  
  // Fetch 7-day forecast (only when needed)
  const { data: forecast = [], isLoading: forecastLoading } = useQuery({
    queryKey: ['/api/weather/forecast', forecastLocation],
    queryFn: () => fetch(`/api/weather/forecast/${encodeURIComponent(forecastLocation)}`).then(res => res.json()),
    enabled: forecastOpen && !!forecastLocation,
  });

  // Filter trips based on search term
  const filteredTrips = trips.filter(trip => 
    trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get upcoming trips (sorted by start date)
  const upcomingTrips = [...filteredTrips]
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setCreateTripOpen(true);
  };

  const handleCreateTripClose = () => {
    setSelectedTrip(null);
    setCreateTripOpen(false);
  };

  // Get the next trip for weather
  const nextTrip = trips.length > 0 ? trips[0] : null;

  return (
    <div className="flex h-screen bg-neutral-100">
      <div className="hidden md:flex md:w-64 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header onSearch={(term) => setSearchTerm(term)} />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-neutral-800 sm:text-3xl sm:truncate">
                  Welcome back, {user?.name.split(' ')[0]}!
                </h2>
                <p className="mt-1 text-neutral-500">
                  {trips.length > 0 
                    ? `You have ${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} planned. Here's an overview of your travel plans.` 
                    : 'Start planning your next adventure by creating a new trip.'}
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Button variant="outline" className="mr-3">
                  Import Trip
                </Button>
                <Button onClick={() => setCreateTripOpen(true)}>
                  Create New Trip
                </Button>
              </div>
            </div>

            {/* Weather widget for the next trip */}
            {nextTrip && weather && (
              <WeatherCard 
                trip={nextTrip}
                weatherData={weather}
                onForecastClick={() => {
                  setForecastLocation(nextTrip.destination);
                  setForecastOpen(true);
                }}
                isLoading={weatherLoading}
              />
            )}
            
            {/* 7-day Forecast Modal */}
            <Dialog open={forecastOpen} onOpenChange={setForecastOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>7-Day Weather Forecast for {forecastLocation}</DialogTitle>
                </DialogHeader>
                
                {forecastLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {Array(7).fill(0).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-10 w-10 bg-gray-200 rounded-full mx-auto mb-2"></div>
                          <div className="h-5 bg-gray-200 rounded mb-2 mx-auto w-16"></div>
                          <div className="h-4 bg-gray-200 rounded mb-1 w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : forecast.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {forecast.map((day, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-center text-base font-medium">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-center">
                          <div className="mb-1">
                            {(() => {
                              const condition = day.condition.toLowerCase();
                              if (condition.includes('sun') || condition.includes('clear')) 
                                return <Sun className="h-10 w-10 text-yellow-500 mx-auto" />;
                              if (condition.includes('rain')) 
                                return <CloudRain className="h-10 w-10 text-blue-500 mx-auto" />;
                              if (condition.includes('snow')) 
                                return <CloudSnow className="h-10 w-10 text-blue-300 mx-auto" />;
                              if (condition.includes('thunder') || condition.includes('lightning')) 
                                return <CloudLightning className="h-10 w-10 text-purple-500 mx-auto" />;
                              if (condition.includes('drizzle')) 
                                return <CloudDrizzle className="h-10 w-10 text-blue-400 mx-auto" />;
                              return <Cloud className="h-10 w-10 text-gray-400 mx-auto" />;
                            })()}
                          </div>
                          <p className="text-2xl font-bold">{day.temperature}°C</p>
                          <p className="text-sm text-neutral-500">{day.condition}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p>No forecast data available for this location.</p>
                    <Button onClick={() => setForecastOpen(false)} className="mt-4">Close</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Upcoming Trips */}
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Upcoming Trips</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tripsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md h-72 animate-pulse">
                    <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : upcomingTrips.length > 0 ? (
                upcomingTrips.map(trip => {
                  const tripTags = tags.filter(tag => tag.tripId === trip.id);
                  return (
                    <TripCard 
                      key={trip.id} 
                      trip={trip} 
                      tags={tripTags}
                      onEditClick={handleEditTrip}
                    />
                  );
                })
              ) : null}

              {/* Create New Trip Card */}
              <div className="border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center p-6 bg-white h-full">
                <Plus className="h-12 w-12 text-neutral-400" />
                <h3 className="mt-2 text-lg font-medium text-neutral-800">Create a new trip</h3>
                <p className="mt-1 text-sm text-neutral-500 text-center">
                  Start planning your next adventure with TravelCloud
                </p>
                <Button onClick={() => setCreateTripOpen(true)} className="mt-4">
                  Create Trip
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CreateTripDialog 
        open={createTripOpen} 
        onOpenChange={handleCreateTripClose}
        editTrip={selectedTrip}
      />
    </div>
  );
}
