import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trip, Schedule } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatDateRange, getDaysArray } from "@/lib/utils";
import {
  PlusCircle,
  MapPin,
  Clock,
  CalendarIcon,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TripItineraryProps {
  tripId: number;
}

// Validation schema for itinerary item
const itineraryItemSchema = z.object({
  day: z.date({
    required_error: "Day is required",
  }),
  title: z.string().min(2, "Title must be at least 2 characters"),
  time: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

type ItineraryItemValues = z.infer<typeof itineraryItemSchema>;

export function TripItinerary({ tripId }: TripItineraryProps) {
  const [open, setOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [editingItem, setEditingItem] = useState<Schedule | null>(null);

  // Fetch trip details
  const { data: trip } = useQuery<Trip>({
    queryKey: ["/api/trips", tripId],
    enabled: !!tripId,
  });

  // Fetch itinerary items
  const { data: schedules = [], isLoading } = useQuery<Schedule[]>({
    queryKey: [`/api/trips/${tripId}/schedules`],
    enabled: !!tripId,
  });

  // Form for adding/editing itinerary items
  const form = useForm<ItineraryItemValues>({
    resolver: zodResolver(itineraryItemSchema),
    defaultValues: {
      title: "",
      time: "",
      location: "",
      description: "",
      day: new Date(),
    },
    mode: "onChange",
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!open) {
      setEditingItem(null);
      form.reset();
    }
  }, [open, form]);

  // Set form values when editing
  useEffect(() => {
    if (editingItem) {
      form.setValue("day", new Date(editingItem.day));
      form.setValue("title", editingItem.title);
      form.setValue("time", editingItem.time || "");
      form.setValue("location", editingItem.location || "");
      form.setValue("description", editingItem.description || "");
      setSelectedDay(new Date(editingItem.day));
    }
  }, [editingItem, form]);

  // Add itinerary item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: ItineraryItemValues) => {
      const res = await apiRequest(
        "POST",
        `/api/trips/${tripId}/schedules`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/trips/${tripId}/schedules`],
      });
      form.reset();
      setOpen(false);
      toast({
        title: "Success",
        description: "Itinerary item added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update itinerary item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: ItineraryItemValues;
    }) => {
      const res = await apiRequest("PATCH", `/api/schedules/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/trips/${tripId}/schedules`],
      });
      form.reset();
      setOpen(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Itinerary item updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete itinerary item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/trips/${tripId}/schedules`],
      });
      toast({
        title: "Success",
        description: "Itinerary item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ItineraryItemValues) => {
    // Ensure tripId exists
    if (!tripId) {
      toast({
        title: "Error",
        description: "No trip selected",
        variant: "destructive",
      });
      return;
    }

    // Ensure day is selected
    if (!data.day) {
      toast({
        title: "Error",
        description: "Please select a day",
        variant: "destructive",
      });
      return;
    }

    // Format the data
    const formattedData = {
      ...data,
      day: data.day, // Keep as Date object
      tripId: tripId,
      time: data.time || undefined,
      location: data.location || undefined,
      description: data.description || undefined,
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: formattedData });
    } else {
      addItemMutation.mutate(formattedData);
    }
  };

  // Group schedules by day
  const schedulesByDay: Record<string, Schedule[]> = schedules.reduce(
    (acc, schedule) => {
      const day = new Date(schedule.day).toDateString();
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(schedule);
      return acc;
    },
    {} as Record<string, Schedule[]>
  );

  // Generate days between start and end date
  const tripDays: Date[] = trip
    ? getDaysArray(new Date(trip.startDate), new Date(trip.endDate))
    : [];

  // Handle delete
  const handleDelete = (id: number): void => {
    if (confirm("Are you sure you want to delete this itinerary item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  // Handle edit
  const handleEdit = (item: Schedule): void => {
    setEditingItem(item);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trip Itinerary</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Itinerary Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="px-6 py-6 space-y-6">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Itinerary Item" : "Add Itinerary Item"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update the details of your itinerary item."
                    : "Add a new item to your trip itinerary. Include as much detail as you'd like."}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="day"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Day</FormLabel>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date);
                              setSelectedDay(date);
                            }
                          }}
                          disabled={(date) => {
                            if (!trip) return true;
                            const tripStart = new Date(trip.startDate);
                            const tripEnd = new Date(trip.endDate);
                            return date < tripStart || date > tripEnd;
                          }}
                          initialFocus
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Visit Eiffel Tower"
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="time"
                              {...field}
                              className="flex-1"
                              value={field.value || ""}
                              onChange={(e) => {
                                const time = e.target.value;
                                if (!time) {
                                  field.onChange("");
                                  return;
                                }
                                const [hours, minutes] = time.split(":");
                                const date = new Date(
                                  2000,
                                  0,
                                  1,
                                  parseInt(hours),
                                  parseInt(minutes)
                                );
                                field.onChange(time);
                              }}
                            />
                            {field.value && (
                              <Select
                                value={
                                  parseInt(field.value.split(":")[0]) >= 12
                                    ? "pm"
                                    : "am"
                                }
                                onValueChange={(value) => {
                                  if (!field.value) return;
                                  const [hours, minutes] =
                                    field.value.split(":");
                                  let hour = parseInt(hours);
                                  if (value === "am" && hour >= 12) {
                                    hour -= 12;
                                  } else if (value === "pm" && hour < 12) {
                                    hour += 12;
                                  }
                                  field.onChange(
                                    `${hour
                                      .toString()
                                      .padStart(2, "0")}:${minutes}`
                                  );
                                }}
                              >
                                <SelectTrigger className="w-[80px]">
                                  <SelectValue placeholder="AM/PM" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="am">AM</SelectItem>
                                  <SelectItem value="pm">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 5 Avenue Anatole France, 75007 Paris"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes or details about this activity..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="submit"
                      variant="default"
                      disabled={
                        addItemMutation.isPending ||
                        updateItemMutation.isPending
                      }
                    >
                      {editingItem ? "Update Item" : "Add Item"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"></div>
        </div>
      ) : schedules.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              No itinerary items added yet. Plan your trip by adding activities,
              restaurants, or landmarks to visit each day.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[70vh] max-h-[600px] pr-4 overflow-y-auto touch-auto overscroll-contain">
          {tripDays.map((day: Date) => {
            const dayKey = day.toDateString();
            const dayItems: Schedule[] = schedulesByDay[dayKey] || [];

            return (
              <div key={dayKey} className="mb-6 trip-day">
                <div className="sticky top-0 bg-background z-10 pt-2 pb-2 day-header">
                  <h3 className="font-medium text-lg flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                    {day.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                    <Badge
                      className="ml-2"
                      variant={dayItems.length > 0 ? "default" : "outline"}
                    >
                      {dayItems.length}{" "}
                      {dayItems.length === 1 ? "item" : "items"}
                    </Badge>
                  </h3>
                  <Separator className="mt-2" />
                </div>

                {dayItems.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    <p>No activities planned for this day</p>
                    <Button
                      variant="link"
                      className="mt-1"
                      onClick={() => {
                        setSelectedDay(day);
                        form.setValue("day", day);
                        setOpen(true);
                      }}
                    >
                      Add Activity
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 mt-3 time-sections">
                    {/* Morning Activities (AM) */}
                    {dayItems.filter(
                      (item) =>
                        item.time && parseInt(item.time.split(":")[0]) < 12
                    ).length > 0 && (
                      <div className="time-section">
                        <h4 className="text-sm font-medium mb-2 flex items-center time-section-header">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Morning
                          </span>
                        </h4>
                        <div className="space-y-3 activity-list">
                          {dayItems
                            .filter(
                              (item) =>
                                item.time &&
                                parseInt(item.time.split(":")[0]) < 12
                            )
                            .sort((a, b) => a.time!.localeCompare(b.time!))
                            .map((item) => (
                              <Card
                                key={item.id}
                                className="relative overflow-hidden"
                              >
                                <div className="absolute top-2 right-2 flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg pr-16">
                                    {item.title}
                                  </CardTitle>
                                  {item.time && (
                                    <CardDescription className="flex items-center text-sm">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {new Date(
                                        `2000-01-01T${item.time}`
                                      ).toLocaleTimeString([], {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="pb-4">
                                  {item.location && (
                                    <div className="flex items-start mb-2 text-sm">
                                      <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                      <span>{item.location}</span>
                                    </div>
                                  )}
                                  {item.description && (
                                    <div className="text-sm mt-2">
                                      {item.description}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Activities (PM) */}
                    {dayItems.filter(
                      (item) =>
                        item.time && parseInt(item.time.split(":")[0]) >= 12
                    ).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Afternoon
                          </span>
                        </h4>
                        <div className="space-y-3">
                          {dayItems
                            .filter(
                              (item) =>
                                item.time &&
                                parseInt(item.time.split(":")[0]) >= 12
                            )
                            .sort((a, b) => a.time!.localeCompare(b.time!))
                            .map((item) => (
                              <Card
                                key={item.id}
                                className="relative overflow-hidden"
                              >
                                <div className="absolute top-2 right-2 flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg pr-16">
                                    {item.title}
                                  </CardTitle>
                                  {item.time && (
                                    <CardDescription className="flex items-center text-sm">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {new Date(
                                        `2000-01-01T${item.time}`
                                      ).toLocaleTimeString([], {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="pb-4">
                                  {item.location && (
                                    <div className="flex items-start mb-2 text-sm">
                                      <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                      <span>{item.location}</span>
                                    </div>
                                  )}
                                  {item.description && (
                                    <div className="text-sm mt-2">
                                      {item.description}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Unscheduled Activities */}
                    {dayItems.filter((item) => !item.time).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Unscheduled
                          </span>
                        </h4>
                        <div className="space-y-3">
                          {dayItems
                            .filter((item) => !item.time)
                            .map((item) => (
                              <Card
                                key={item.id}
                                className="relative overflow-hidden"
                              >
                                <div className="absolute top-2 right-2 flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg pr-16">
                                    {item.title}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pb-4">
                                  {item.location && (
                                    <div className="flex items-start mb-2 text-sm">
                                      <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                      <span>{item.location}</span>
                                    </div>
                                  )}
                                  {item.description && (
                                    <div className="text-sm mt-2">
                                      {item.description}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}
