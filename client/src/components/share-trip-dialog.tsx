import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShareTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: number;
}

const shareFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  role: z.enum(["viewer", "editor"]),
});

type ShareFormValues = z.infer<typeof shareFormSchema>;

export function ShareTripDialog({
  open,
  onOpenChange,
  tripId,
}: ShareTripDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      username: "",
      role: "viewer",
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (data: ShareFormValues) => {
      const response = await apiRequest(
        "POST",
        `/api/trips/${tripId}/share`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate shared trips and the specific trip's data
      queryClient.invalidateQueries({ queryKey: ["/api/shared-trips"] });
      queryClient.invalidateQueries({ queryKey: [`/api/trips/${tripId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/trip-members"] });

      toast({
        title: "Success",
        description: "Trip shared successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShareFormValues) => {
    shareMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Trip</DialogTitle>
          <DialogDescription>
            Share your trip with other users and choose their access level.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <span className="flex flex-col gap-1">
                          <span>Viewer</span>
                          <span className="text-xs text-neutral-500">
                            Can view trip details but cannot edit
                          </span>
                        </span>
                      </SelectItem>
                      <SelectItem value="editor">
                        <span className="flex flex-col gap-1">
                          <span>Editor</span>
                          <span className="text-xs text-neutral-500">
                            Can view and edit trip details
                          </span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={shareMutation.isPending}
            >
              {shareMutation.isPending ? "Sharing..." : "Share Trip"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
