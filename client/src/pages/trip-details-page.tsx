import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleItem } from "@/components/ui/schedule-item";
import { PackingItemComponent } from "@/components/ui/packing-item";
import { ShareIcon, Printer, Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trip, Schedule, PackingItem, PackingCategory } from "@shared/schema";
import { format } from "date-fns";
import { getDaysArray } from "@/lib/utils";

export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("schedule");
  const [activeDay, setActiveDay] = useState<string | null>(null);
  
  // Fetch trip details
  const { data: trip, isLoading: tripLoading, error: tripError } = useQuery<Trip>({
    queryKey: [`/api/trips/${id}`],
    enabled: !!id,
  });

  // Fetch schedules for this trip
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: [`/api/trips/${id}/schedules`],
    enabled: !!id,
  });

  // Fetch packing items for this trip
  const { data: packingItems = [], isLoading: packingLoading } = useQuery<PackingItem[]>({
    queryKey: [`/api/trips/${id}/packing-items`],
    enabled: !!id,
  });

  // Fetch packing categories
  const { data: packingCategories = [] } = useQuery<PackingCategory[]>({
    queryKey: ['/api/packing-categories'],
  });

  // Toggle packed status mutation
  const togglePackedMutation = useMutation({
    mutationFn: async ({ itemId, isPacked }: { itemId: number; isPacked: boolean }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/packing-items/${itemId}`, 
        { isPacked }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/trips/${id}/packing-items`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  if (tripLoading) {
    return (
      <div className="flex h-screen bg-neutral-100">
        <div className="hidden md:flex md:w-64 h-screen">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="bg-white shadow rounded-lg p-6 h-96"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (tripError || !trip) {
    return (
      <div className="flex h-screen bg-neutral-100">
        <div className="hidden md:flex md:w-64 h-screen">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
                <p className="text-neutral-500 mb-4">
                  The trip you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <Button 
                  variant="default" 
                  onClick={() => setLocation('/trips')}
                >
                  Back to Trips
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Prepare trip dates for the tabs
  const tripDays = getDaysArray(new Date(trip.startDate), new Date(trip.endDate));
  
  // Set default active day if not set
  if (!activeDay && tripDays.length > 0) {
    setActiveDay(format(tripDays[0], 'yyyy-MM-dd'));
  }

  // Get schedules for the active day
  const daySchedules = schedules.filter(
    schedule => activeDay && format(new Date(schedule.day), 'yyyy-MM-dd') === activeDay
  ).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Get category for each packing item
  const getCategory = (item: PackingItem) => {
    return packingCategories.find(category => category.id === item.categoryId) || null;
  };

  // Calculate packing stats
  const packedItems = packingItems.filter(item => item.isPacked).length;
  const totalItems = packingItems.length;

  return (
    <div className="flex h-screen bg-neutral-100">
      <div className="hidden md:flex md:w-64 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">
                Trip Details: {trip.name}
              </h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex items-center">
                  <ShareIcon className="h-4 w-4 mr-1" />
                  Share Trip
                </Button>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Printer className="h-4 w-4 mr-1" />
                  Print Itinerary
                </Button>
              </div>
            </div>

            <Card className="bg-white shadow overflow-hidden">
              <div className="border-b border-neutral-200">
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="flex -mb-px">
                    <TabsTrigger value="schedule" className="border-b-2 py-4 px-4">Schedule</TabsTrigger>
                    <TabsTrigger value="packing" className="border-b-2 py-4 px-4">Packing List</TabsTrigger>
                    <TabsTrigger value="accommodations" className="border-b-2 py-4 px-4">Accommodations</TabsTrigger>
                    <TabsTrigger value="transportation" className="border-b-2 py-4 px-4">Transportation</TabsTrigger>
                    <TabsTrigger value="notes" className="border-b-2 py-4 px-4">Notes</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <TabsContent value="schedule" className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-neutral-800">Daily Schedule</h4>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Activity
                  </Button>
                </div>

                {/* Day selector tabs */}
                <div className="border-b border-neutral-200 mb-4">
                  <nav className="flex -mb-px overflow-x-auto">
                    {tripDays.map((day, index) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const displayStr = `Day ${index + 1} (${format(day, 'MMM d')})`;
                      return (
                        <a 
                          key={dayStr}
                          href={`#${dayStr}`}
                          className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm mr-4
                            ${activeDay === dayStr 
                              ? 'border-primary text-primary' 
                              : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                            }`}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveDay(dayStr);
                          }}
                        >
                          {displayStr}
                        </a>
                      );
                    })}
                  </nav>
                </div>

                {/* Day schedule */}
                <div className="space-y-4">
                  {schedulesLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-start p-3 border border-neutral-200 rounded-md animate-pulse">
                        <div className="flex-shrink-0 w-16 mr-4">
                          <div className="h-5 bg-gray-300 rounded"></div>
                        </div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))
                  ) : daySchedules.length > 0 ? (
                    daySchedules.map(schedule => (
                      <ScheduleItem 
                        key={schedule.id} 
                        schedule={schedule}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-neutral-500">No activities planned for this day.</p>
                      <Button 
                        variant="link" 
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add an activity
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="packing" className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-neutral-800">
                    {trip.name} Essentials
                  </h4>
                  <div className="text-sm text-neutral-500">
                    <span className="font-medium">{totalItems}</span> items | 
                    <span className="font-medium text-green-500 ml-1">{packedItems}</span> packed
                  </div>
                </div>

                {packingLoading ? (
                  <div className="animate-pulse space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-4 w-4 bg-gray-300 rounded"></div>
                          <div className="ml-3 h-4 bg-gray-300 rounded w-40"></div>
                        </div>
                        <div className="h-5 w-16 bg-gray-300 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : packingItems.length > 0 ? (
                  <ul className="divide-y divide-neutral-200">
                    {packingItems.map(item => (
                      <PackingItemComponent
                        key={item.id}
                        item={item}
                        category={getCategory(item)}
                        onToggle={(id, isChecked) => {
                          togglePackedMutation.mutate({ itemId: id, isPacked: isChecked });
                        }}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-neutral-500">No packing items added yet.</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add packing items
                    </Button>
                  </div>
                )}

                {packingItems.length > 0 && (
                  <div className="mt-4 flex">
                    <Button variant="outline" className="mr-3">
                      Mark All as Packed
                    </Button>
                    <Button variant="outline">
                      Clear All
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="accommodations" className="p-4 md:p-6">
                <div className="text-center py-6">
                  <p className="text-neutral-500">No accommodations added yet.</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add accommodation details
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="transportation" className="p-4 md:p-6">
                <div className="text-center py-6">
                  <p className="text-neutral-500">No transportation details added yet.</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add transportation details
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="p-4 md:p-6">
                <div className="text-center py-6">
                  <p className="text-neutral-500">No notes added yet.</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add notes
                  </Button>
                </div>
              </TabsContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
