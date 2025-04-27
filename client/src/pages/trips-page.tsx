import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trip, TripTag } from "@shared/schema";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { TripCard } from "@/components/ui/trip-card";
import { CreateTripDialog } from "@/components/create-trip-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { format, isBefore, isAfter } from "date-fns";

export default function TripsPage() {
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

  // Filter trips based on search term
  const filteredTrips = trips.filter(trip => 
    trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categorize trips
  const today = new Date();
  
  const upcomingTrips = filteredTrips.filter(trip => 
    isBefore(today, new Date(trip.startDate))
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const currentTrips = filteredTrips.filter(trip => 
    isAfter(today, new Date(trip.startDate)) && 
    isBefore(today, new Date(trip.endDate))
  );
  
  const pastTrips = filteredTrips.filter(trip => 
    isAfter(today, new Date(trip.endDate))
  ).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setCreateTripOpen(true);
  };

  const handleCreateTripClose = () => {
    setSelectedTrip(null);
    setCreateTripOpen(false);
  };

  const TripSection = ({ title, trips, emptyMessage }: { title: string, trips: Trip[], emptyMessage: string }) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">{title}</h3>
      {trips.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map(trip => {
            const tripTags = tags.filter(tag => tag.tripId === trip.id);
            return (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                tags={tripTags}
                onEditClick={handleEditTrip}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
          <p className="text-neutral-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-neutral-100">
      <div className="hidden md:flex md:w-64 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header onSearch={(term) => setSearchTerm(term)} />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-800 mb-4 sm:mb-0">
                My Trips
              </h2>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <Input 
                    className="pl-9" 
                    placeholder="Search trips..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Button onClick={() => setCreateTripOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Trip
                </Button>
              </div>
            </div>

            {tripsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="bg-white rounded-lg shadow h-72">
                          <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                          <div className="p-4">
                            <div className="h-5 bg-gray-300 rounded mb-2"></div>
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Current Trips */}
                <TripSection 
                  title="Current Trips" 
                  trips={currentTrips} 
                  emptyMessage="You don't have any active trips right now." 
                />
                
                {/* Upcoming Trips */}
                <TripSection 
                  title="Upcoming Trips" 
                  trips={upcomingTrips} 
                  emptyMessage="You don't have any upcoming trips. Start planning your next adventure!" 
                />
                
                {/* Past Trips */}
                <TripSection 
                  title="Past Trips" 
                  trips={pastTrips} 
                  emptyMessage="You don't have any past trips yet." 
                />
              </>
            )}
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
