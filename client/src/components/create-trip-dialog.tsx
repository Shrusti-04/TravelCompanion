import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
// Import the zod resolver more explicitly to avoid package resolution issues
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { insertTripSchema, Trip } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CreateTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTrip?: Trip | null;
}

// Extend the schema to ensure end date is after start date
const tripFormSchema = insertTripSchema.extend({
  endDate: z.coerce.date(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

type TripFormValues = z.infer<typeof tripFormSchema>;

export function CreateTripDialog({ 
  open, 
  onOpenChange,
  editTrip = null 
}: CreateTripDialogProps) {
  const { toast } = useToast();
  const isEditing = !!editTrip;

  // Set default values based on whether we're editing or creating
  const defaultValues: Partial<TripFormValues> = editTrip
    ? {
        name: editTrip.name,
        destination: editTrip.destination,
        startDate: new Date(editTrip.startDate),
        endDate: new Date(editTrip.endDate),
        description: editTrip.description || ""
      }
    : {
        name: "",
        destination: "",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to one week trip
        description: ""
      };

  // Form setup
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues
  });

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (data: TripFormValues) => {
      const response = await apiRequest("POST", "/api/trips", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({
        title: "Success!",
        description: "Trip created successfully",
      });
      onOpenChange(false);
      form.reset(defaultValues);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create trip: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async (data: TripFormValues) => {
      if (!editTrip) throw new Error("No trip to update");
      const response = await apiRequest("PATCH", `/api/trips/${editTrip.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: [`/api/trips/${editTrip?.id}`] });
      toast({
        title: "Success!",
        description: "Trip updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update trip: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: TripFormValues) => {
    if (isEditing) {
      updateTripMutation.mutate(data);
    } else {
      createTripMutation.mutate(data);
    }
  };

  const isPending = createTripMutation.isPending || updateTripMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Trip" : "Create a New Trip"}</DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? "Update the details of your trip." 
                  : "Fill in the details for your new adventure."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Amazing Vacation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="Paris, France" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date < form.getValues("startDate")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add some details about your trip..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEditing ? "Update Trip" : "Create Trip"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
