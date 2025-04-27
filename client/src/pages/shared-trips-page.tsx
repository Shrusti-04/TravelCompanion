import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { TripCard } from "@/components/ui/trip-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Search, Users, UserPlus } from "lucide-react";
import { Trip, TripTag, TripMember, User } from "@shared/schema";
import { AvatarWithPresence } from "@/components/ui/avatar-with-presence";

export default function SharedTripsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch shared trips
  const { data: sharedTrips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['/api/shared-trips'],
  });

  // Fetch trip tags
  const { data: allTags = [] } = useQuery<TripTag[]>({
    queryKey: ['/api/trip-tags'],
  });

  // Fetch trip members for each shared trip
  const { data: tripMembers = [] } = useQuery<TripMember[]>({
    queryKey: ['/api/trip-members'],
    enabled: sharedTrips.length > 0,
  });

  // Fetch users data for members
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: tripMembers.length > 0,
  });

  // Filter trips based on search term
  const filteredTrips = sharedTrips.filter(trip => 
    trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get tags for a specific trip
  const getTripTags = (tripId: number) => {
    return allTags.filter(tag => tag.tripId === tripId);
  };

  // Get members for a specific trip
  const getTripMembers = (tripId: number) => {
    return tripMembers.filter(member => member.tripId === tripId);
  };

  // Get user data for a member
  const getMemberUser = (userId: number) => {
    return users.find(user => user.id === userId);
  };

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
              <div className="flex items-center">
                <Share2 className="h-6 w-6 text-primary mr-2" />
                <h2 className="text-2xl font-bold text-neutral-800">
                  Shared Trips
                </h2>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <div className="relative max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <Input 
                    className="pl-9 pr-3" 
                    placeholder="Search shared trips..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {tripsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-md h-72 animate-pulse">
                    <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTrips.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTrips.map(trip => {
                  const tripTags = getTripTags(trip.id);
                  const members = getTripMembers(trip.id);
                  
                  return (
                    <div key={trip.id} className="space-y-2">
                      <TripCard 
                        trip={trip} 
                        tags={tripTags}
                      />
                      
                      {/* Trip shared with */}
                      <Card className="bg-white border-t-0 rounded-t-none -mt-2 pt-0">
                        <CardContent className="p-3">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-neutral-500 mr-2" />
                            <span className="text-sm text-neutral-500">Shared with:</span>
                          </div>
                          <div className="flex mt-2 ml-6 flex-wrap gap-2">
                            {members.length > 0 ? (
                              members.map(member => {
                                const user = getMemberUser(member.userId);
                                if (!user) return null;
                                
                                return (
                                  <div key={member.id} className="flex items-center">
                                    <AvatarWithPresence
                                      name={user.name}
                                      size="sm"
                                    />
                                    <span className="ml-2 text-sm">{user.name}</span>
                                    <span className="ml-1 text-xs text-neutral-500">
                                      ({member.role})
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-sm text-neutral-500">No members yet</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary mb-4">
                  <Share2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-1">No shared trips found</h3>
                <p className="text-neutral-500 mb-6">
                  {searchTerm
                    ? "No shared trips match your search criteria."
                    : "You don't have any trips shared with you yet."}
                </p>
                <Button variant="outline" className="mx-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ask someone to share a trip
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
