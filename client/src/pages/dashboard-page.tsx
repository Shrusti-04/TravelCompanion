import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { WeatherCard } from "@/components/ui/weather-card";
import { TripCard } from "@/components/ui/trip-card";
import { CreateTripDialog } from "@/components/create-trip-dialog";
import { Plus } from "lucide-react";
import { Trip, TripTag } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const [createTripOpen, setCreateTripOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
                onForecastClick={() => {}}
                isLoading={weatherLoading}
              />
            )}

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
