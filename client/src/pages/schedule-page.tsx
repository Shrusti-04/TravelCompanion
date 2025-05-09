import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ScheduleItem } from "@/components/ui/schedule-item";
import { Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Trip, Schedule, InsertSchedule } from "@shared/schema";
import { format, isSameDay } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SchedulePage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  
  // Form states
  const [activityTitle, setActivityTitle] = useState("");
  const [activityTime, setActivityTime] = useState("");
  const [activityLocation, setActivityLocation] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  // Fetch trips
  const { data: trips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips'],
  });

  // Fetch all schedules
  const { data: allSchedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
  });

  // Filter schedules for the selected day and trip
  const daySchedules = allSchedules.filter(schedule => {
    const isSameSelectedDay = isSameDay(new Date(schedule.day), selectedDate);
    return selectedTrip ? (isSameSelectedDay && schedule.tripId === selectedTrip) : isSameSelectedDay;
  }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Get trip by ID
  const getTrip = (tripId: number) => {
    return trips.find(trip => trip.id === tripId);
  };

  // Get dates that have activities
  const getActivityDates = () => {
    const filteredSchedules = selectedTrip 
      ? allSchedules.filter(s => s.tripId === selectedTrip)
      : allSchedules;
      
    return filteredSchedules.map(s => new Date(s.day));
  };
  
  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (activityData: { 
      tripId: number; 
      title: string; 
      day: string; 
      time?: string; 
      location?: string; 
      description?: string 
    }) => {
      const response = await apiRequest("POST", "/api/schedules", activityData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      setAddActivityDialogOpen(false);
      resetForm();
      toast({
        title: "Activity Added",
        description: "The activity has been added to your schedule",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, data }: { 
      id: number;
      data: { 
        title: string; 
        day: string; 
        time?: string; 
        location?: string; 
        description?: string;
      }
    }) => {
      const response = await apiRequest("PATCH", `/api/schedules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Activity Updated",
        description: "The activity has been updated in your schedule",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Activity Deleted",
        description: "The activity has been removed from your schedule",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reset form fields
  const resetForm = () => {
    setActivityTitle("");
    setActivityTime("");
    setActivityLocation("");
    setActivityDescription("");
    setEditingSchedule(null);
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      <div className="hidden md:flex md:w-64 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">
                Schedule
              </h2>
              <div className="mt-4 md:mt-0">
                <Button onClick={() => {
                  if (!selectedTrip) {
                    toast({
                      title: "Trip Required",
                      description: "Please select a trip to add an activity to",
                      variant: "destructive"
                    });
                    return;
                  }
                  setAddActivityDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Activity
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
              {/* Sidebar with Calendar */}
              <div className="md:col-span-4 lg:col-span-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Filter by Trip
                      </label>
                      <select 
                        className="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        value={selectedTrip || ""}
                        onChange={(e) => setSelectedTrip(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">All Trips</option>
                        {trips.map(trip => (
                          <option key={trip.id} value={trip.id}>{trip.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="text-center mb-4">
                      <CalendarIcon className="mx-auto h-6 w-6 text-neutral-500 mb-1" />
                      <h3 className="text-lg font-semibold">
                        {format(selectedDate, "MMMM yyyy")}
                      </h3>
                    </div>
                    
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                      initialFocus
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Main Content - Schedule */}
              <div className="md:col-span-8 lg:col-span-9">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")}
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (!selectedTrip) {
                            toast({
                              title: "Trip Required",
                              description: "Please select a trip to add an activity to",
                              variant: "destructive"
                            });
                            return;
                          }
                          setAddActivityDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Activity
                      </Button>
                    </div>

                    {schedulesLoading ? (
                      <div className="space-y-4">
                        {Array(3).fill(0).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="flex items-start p-3 border border-neutral-200 rounded-md">
                              <div className="flex-shrink-0 w-16 mr-4">
                                <div className="h-5 bg-gray-300 rounded"></div>
                              </div>
                              <div className="flex-1">
                                <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div>
                                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : daySchedules.length > 0 ? (
                      <div className="space-y-4">
                        {daySchedules.map(schedule => {
                          const trip = getTrip(schedule.tripId);
                          return (
                            <div key={schedule.id}>
                              {trip && (
                                <div className="mb-2 text-sm text-neutral-500">
                                  Trip: {trip.name}
                                </div>
                              )}
                              <ScheduleItem 
                                schedule={schedule}
                                onEdit={(schedule) => {
                                  setSelectedTrip(schedule.tripId);
                                  setSelectedDate(new Date(schedule.day));
                                  setActivityTitle(schedule.title);
                                  setActivityTime(schedule.time || "");
                                  setActivityLocation(schedule.location || "");
                                  setActivityDescription(schedule.description || "");
                                  setAddActivityDialogOpen(true);
                                  
                                  // Store the schedule ID for update
                                  setEditingSchedule(schedule);
                                }}
                                onDelete={(id) => {
                                  if (confirm("Are you sure you want to delete this activity?")) {
                                    deleteActivityMutation.mutate(id);
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CalendarIcon className="mx-auto h-12 w-12 text-neutral-300" />
                        <h3 className="mt-2 text-lg font-medium text-neutral-900">No activities for this day</h3>
                        <p className="mt-1 text-sm text-neutral-500">
                          Start by adding activities to your schedule.
                        </p>
                        <div className="mt-6">
                          <Button
                            onClick={() => {
                              if (!selectedTrip) {
                                toast({
                                  title: "Trip Required",
                                  description: "Please select a trip to add an activity to",
                                  variant: "destructive"
                                });
                                return;
                              }
                              setAddActivityDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Activity
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Activity Dialog */}
      <Dialog 
        open={addActivityDialogOpen} 
        onOpenChange={(open) => {
          setAddActivityDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Edit Activity" : "Add Activity"}</DialogTitle>
            <DialogDescription>
              {editingSchedule 
                ? `Edit activity for ${format(selectedDate, "MMMM d, yyyy")}`
                : `Add a new activity to your schedule for ${format(selectedDate, "MMMM d, yyyy")}`
              }
              {selectedTrip ? ` (${trips.find(t => t.id === selectedTrip)?.name})` : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activity-title" className="text-right">
                Title
              </Label>
              <Input
                id="activity-title"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                className="col-span-3"
                placeholder="Meeting, Tour, etc."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activity-time" className="text-right">
                Time
              </Label>
              <Input
                id="activity-time"
                value={activityTime}
                onChange={(e) => setActivityTime(e.target.value)}
                className="col-span-3"
                placeholder="e.g. 9:00 AM"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activity-location" className="text-right">
                Location
              </Label>
              <Input
                id="activity-location"
                value={activityLocation}
                onChange={(e) => setActivityLocation(e.target.value)}
                className="col-span-3"
                placeholder="Address or venue name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activity-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="activity-description"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                className="col-span-3"
                placeholder="Additional details..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddActivityDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!activityTitle.trim()) {
                  toast({
                    title: "Error",
                    description: "Activity title is required",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (!selectedTrip) {
                  toast({
                    title: "Error",
                    description: "Please select a trip",
                    variant: "destructive"
                  });
                  return;
                }
                
                const activityData = {
                  tripId: selectedTrip,
                  title: activityTitle.trim(),
                  day: selectedDate.toISOString(),
                  time: activityTime.trim() || undefined,
                  location: activityLocation.trim() || undefined,
                  description: activityDescription.trim() || undefined
                };
                
                if (editingSchedule) {
                  // Update existing activity
                  updateActivityMutation.mutate({
                    id: editingSchedule.id,
                    data: activityData
                  });
                  setAddActivityDialogOpen(false);
                  resetForm();
                } else {
                  // Add new activity
                  addActivityMutation.mutate(activityData);
                }
              }}
              disabled={addActivityMutation.isPending || updateActivityMutation.isPending}
            >
              {editingSchedule 
                ? (updateActivityMutation.isPending ? "Updating..." : "Update Activity")
                : (addActivityMutation.isPending ? "Adding..." : "Add Activity")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}