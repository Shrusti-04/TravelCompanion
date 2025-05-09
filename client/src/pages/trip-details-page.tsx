import "@/styles/print.css";
import { ShareTripDialog } from "@/components/share-trip-dialog";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleItem } from "@/components/ui/schedule-item";
import { PackingItemComponent } from "@/components/ui/packing-item";
import {
  ShareIcon,
  Printer,
  Plus,
  Edit,
  Trash2,
  Link as LinkIcon,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trip, Schedule, PackingItem, PackingCategory } from "@shared/schema";
import { format } from "date-fns";
import { getDaysArray } from "@/lib/utils";
import { TripItinerary } from "@/components/trip-itinerary";

export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"schedule" | "packing" | "all">(
    "schedule"
  );
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Copy link handler
  const handlePrint = () => {
    const printContent = document.createElement("div");
    printContent.className = "print-content";

    // Add trip header
    const header = document.createElement("div");
    header.className = "print-header";
    header.innerHTML = `
      <h1 style="font-size: 24pt; margin-bottom: 8px;">${trip?.name}</h1>
      <p style="font-size: 14pt; color: #666;">${format(
        new Date(trip?.startDate),
        "MMM d, yyyy"
      )} - ${format(new Date(trip?.endDate), "MMM d, yyyy")}</p>
    `;

    // Create temporary print container
    const printContainer = document.createElement("div");
    printContainer.style.display = "none";
    printContainer.appendChild(header);

    // Clone schedule and packing content
    const scheduleContent = document
      .querySelector('[data-id="schedule-content"]')
      ?.cloneNode(true);
    const packingContent = document
      .querySelector('[data-id="packing-content"]')
      ?.cloneNode(true);

    if (scheduleContent) printContainer.appendChild(scheduleContent);
    if (packingContent) printContainer.appendChild(packingContent);

    // Add to document, print, then remove
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/trips/${id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Share this link to let others view the trip details",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the link manually",
        variant: "destructive",
      });
    }
  };

  // Fetch trip details
  const {
    data: trip,
    isLoading: tripLoading,
    error: tripError,
  } = useQuery<Trip>({
    queryKey: [`/api/trips/${id}`],
    enabled: !!id,
  });

  // Fetch packing items for this trip
  const { data: packingItems = [], isLoading: packingLoading } = useQuery<
    PackingItem[]
  >({
    queryKey: [`/api/trips/${id}/packing-items`],
    enabled: !!id,
  });

  // Fetch packing categories
  const { data: packingCategories = [] } = useQuery<PackingCategory[]>({
    queryKey: ["/api/packing-categories"],
  });

  // Toggle packed status mutation
  const togglePackedMutation = useMutation({
    mutationFn: async ({
      itemId,
      isPacked,
    }: {
      itemId: number;
      isPacked: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/packing-items/${itemId}`,
        { isPacked }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/trips/${id}/packing-items`],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add transportation mutation
  const addTransportationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        `/api/trips/${id}/transportation`,
        {
          ...data,
          departureDate: data.departureDate.toISOString(),
          arrivalDate: data.arrivalDate.toISOString(),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/trips/${id}/transportation`],
      });
      setIsAddingTransportation(false);
      toast({
        title: "Success",
        description: "Transportation added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch transportation for this trip
  const { data: transportation = [], isLoading: transportationLoading } =
    useQuery({
      queryKey: [`/api/trips/${id}/transportation`],
      enabled: !!id,
    });

  // Handle transportation form submission
  const handleAddTransportation = async (data: any) => {
    addTransportationMutation.mutate(data);
  };

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
                  The trip you're looking for doesn't exist or you don't have
                  permission to view it.
                </p>
                <Button variant="default" onClick={() => setLocation("/trips")}>
                  Back to Trips
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Get category for each packing item
  const getCategory = (item: PackingItem) => {
    return (
      packingCategories.find((category) => category.id === item.categoryId) ||
      null
    );
  };

  // Calculate packing stats
  const packedItems = packingItems.filter((item) => item.isPacked).length;
  const totalItems = packingItems.length;

  return (
    <div className="flex h-screen bg-neutral-100">
      <div className="hidden md:flex md:w-64 h-screen">
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div
          className="flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-neutral-800">
                  Trip Details: {trip?.name}
                </h3>
                {trip?.isShared && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <ShareIcon className="h-4 w-4 mr-1" />
                    Shared
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 no-print">
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={handleCopyLink}
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => setShowShareDialog(true)}
                >
                  <ShareIcon className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </div>

            {/* Share Dialog */}
            <ShareTripDialog
              open={showShareDialog}
              onOpenChange={setShowShareDialog}
              tripId={parseInt(id!)}
            />

            <Card className="bg-white shadow overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="border-b border-neutral-200 no-print">
                  <TabsList className="flex -mb-px">
                    <TabsTrigger
                      value="schedule"
                      className="border-b-2 py-4 px-4"
                    >
                      Schedule
                    </TabsTrigger>
                    <TabsTrigger
                      value="packing"
                      className="border-b-2 py-4 px-4"
                    >
                      Packing List
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Print Header */}
                <div className="hidden print:block p-4 md:p-6 border-b border-neutral-200">
                  <h2 className="text-2xl font-bold">{trip.name}</h2>
                  <p className="text-neutral-500 mt-1">
                    {format(new Date(trip.startDate), "MMM d, yyyy")} -{" "}
                    {format(new Date(trip.endDate), "MMM d, yyyy")}
                  </p>
                </div>

                <TabsContent
                  value="schedule"
                  className="p-4 md:p-6 print-section"
                  data-id="schedule-content"
                >
                  <h4 className="text-base font-semibold text-neutral-800 mb-4 print-only">
                    Trip Schedule
                  </h4>
                  {/* New Itinerary Component */}
                  <TripItinerary tripId={parseInt(id)} />
                </TabsContent>

                <TabsContent
                  value="packing"
                  className="p-4 md:p-6 print-section"
                  data-id="packing-content"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-neutral-800">
                      {trip.name} Essentials
                    </h4>
                    <div className="text-sm text-neutral-500">
                      <span className="font-medium">{totalItems}</span> items |
                      <span className="font-medium text-green-500 ml-1">
                        {packedItems}
                      </span>{" "}
                      packed
                    </div>
                  </div>

                  {packingLoading ? (
                    <div className="animate-pulse space-y-4">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="py-3 flex items-center justify-between"
                          >
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
                      {packingItems.map((item) => (
                        <PackingItemComponent
                          key={item.id}
                          item={item}
                          category={getCategory(item)}
                          onToggle={(id, isChecked) => {
                            togglePackedMutation.mutate({
                              itemId: id,
                              isPacked: isChecked,
                            });
                          }}
                          onEdit={() => {}}
                          onDelete={() => {}}
                        />
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-neutral-500">
                        No packing items added yet.
                      </p>
                      <Button variant="link" className="mt-2">
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
                      <Button variant="outline">Clear All</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
