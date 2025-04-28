import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackingItemComponent } from "@/components/ui/packing-item";
import { Search, Plus, Package } from "lucide-react";
import { PackingItem, PackingCategory, Trip } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PackingPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");

  // Fetch trips
  const { data: trips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips'],
  });

  // Fetch all packing items
  const { data: allPackingItems = [], isLoading: packingLoading } = useQuery<PackingItem[]>({
    queryKey: ['/api/packing-items'],
  });

  // Fetch packing categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<PackingCategory[]>({
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
      queryClient.invalidateQueries({ queryKey: ['/api/packing-items'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Add packing item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: { name: string; categoryId?: number; quantity: number }) => {
      if (!selectedTrip) {
        throw new Error("Please select a trip to add items to");
      }
      
      const response = await apiRequest(
        "POST", 
        `/api/trips/${selectedTrip}/packing-items`, 
        {
          ...data,
          isPacked: false
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packing-items'] });
      if (selectedTrip) {
        queryClient.invalidateQueries({ queryKey: [`/api/trips/${selectedTrip}/packing-items`] });
      }
      
      // Reset form values
      setNewItemName("");
      setNewItemCategory("");
      setNewItemQuantity("1");
      setAddItemDialogOpen(false);
      
      toast({
        title: "Item Added",
        description: "Item has been added to your packing list"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Filter items based on search term, selected trip and category
  const filteredItems = allPackingItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrip = selectedTrip === null || item.tripId === selectedTrip;
    const matchesCategory = selectedCategory === "all" || 
      (item.categoryId !== null && item.categoryId.toString() === selectedCategory);
    
    return matchesSearch && matchesTrip && matchesCategory;
  });

  // Get category for an item
  const getCategory = (item: PackingItem) => {
    return categories.find(category => category.id === item.categoryId) || null;
  };

  // Calculate packing stats
  const packedItems = filteredItems.filter(item => item.isPacked).length;
  const totalItems = filteredItems.length;

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
                Packing List
              </h2>
              <div className="mt-4 md:mt-0">
                <Button onClick={() => {
                  if (!selectedTrip) {
                    toast({
                      title: "Trip Required",
                      description: "Please select a trip to add items to",
                      variant: "destructive"
                    });
                    return;
                  }
                  // Open the dialog to add a new item
                  setAddItemDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </div>

            <Card className="bg-white shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-neutral-800">
                    {selectedTrip 
                      ? `${trips.find(t => t.id === selectedTrip)?.name} Essentials` 
                      : "All Packing Items"}
                  </h4>
                  <div className="text-sm text-neutral-500">
                    <span className="font-medium">{totalItems}</span> items | 
                    <span className="font-medium text-green-500 ml-1">{packedItems}</span> packed
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-12 mb-4">
                  <div className="md:col-span-5">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-neutral-400" />
                      </div>
                      <Input 
                        className="pl-9" 
                        placeholder="Search packing items..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-4">
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
                </div>

                <div className="border-b border-neutral-200 mb-4">
                  <Tabs
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    className="w-full"
                  >
                    <TabsList className="flex -mb-px overflow-x-auto">
                      <TabsTrigger value="all" className="border-b-2 whitespace-nowrap py-2 px-3 mr-4">
                        All Items
                      </TabsTrigger>
                      {categories.map(category => (
                        <TabsTrigger 
                          key={category.id} 
                          value={category.id.toString()}
                          className="border-b-2 whitespace-nowrap py-2 px-3 mr-4"
                        >
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
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
                ) : filteredItems.length > 0 ? (
                  <>
                    <ul className="divide-y divide-neutral-200">
                      {filteredItems.map(item => (
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

                    <div className="mt-4 flex">
                      <Button variant="outline" className="mr-3">
                        Mark All as Packed
                      </Button>
                      <Button variant="outline">
                        Clear All
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-neutral-300" />
                    <h3 className="mt-2 text-lg font-medium text-neutral-900">No packing items found</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {searchTerm 
                        ? "Try adjusting your search or filters." 
                        : "Start by adding items to your packing list."}
                    </p>
                    <div className="mt-6">
                      <Button>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Packing Item</DialogTitle>
            <DialogDescription>
              Add a new item to your packing list for {
                selectedTrip ? trips.find(t => t.id === selectedTrip)?.name : 'your trip'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-name" className="text-right">
                Item Name
              </Label>
              <Input
                id="item-name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="col-span-3"
                placeholder="T-shirt, passport, etc."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-category" className="text-right">
                Category
              </Label>
              <Select 
                value={newItemCategory} 
                onValueChange={setNewItemCategory}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="item-quantity"
                type="number"
                min="1"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!newItemName.trim()) {
                  toast({
                    title: "Error",
                    description: "Item name is required",
                    variant: "destructive"
                  });
                  return;
                }
                
                addItemMutation.mutate({
                  name: newItemName.trim(),
                  categoryId: newItemCategory ? Number(newItemCategory) : undefined,
                  quantity: Number(newItemQuantity) || 1
                });
              }}
              disabled={addItemMutation.isPending}
            >
              {addItemMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
