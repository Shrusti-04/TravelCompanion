import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getInitials } from "@/lib/utils";
import { Shield, Mail, Bell, User, Key } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  tripReminders: z.boolean(),
  packingReminders: z.boolean(),
  weatherAlerts: z.boolean(),
  marketingEmails: z.boolean(),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form setup
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Password form setup
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification settings form
  const notificationsForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      tripReminders: true,
      packingReminders: true,
      weatherAlerts: true,
      marketingEmails: false,
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      const response = await apiRequest("PATCH", "/api/user/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSettingsSchema>) => {
      const response = await apiRequest("PATCH", "/api/user/notifications", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordFormSchema>) => {
    updatePasswordMutation.mutate(data);
  };

  const onNotificationsSubmit = (data: z.infer<typeof notificationSettingsSchema>) => {
    updateNotificationsMutation.mutate(data);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-neutral-100">
      <div className="hidden md:flex md:w-64 h-screen">
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">Account Settings</h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full md:w-auto">
                <TabsTrigger value="profile" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>Profile</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  <span>Notifications</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account profile information and email address.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src="" alt={user.name} />
                        <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <Button variant="outline" size="sm" className="mb-2">
                          Change Avatar
                        </Button>
                        <p className="text-sm text-neutral-500">
                          JPG, GIF or PNG. Max size of 2MB.
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormItem className="text-xs text-neutral-500">
                          <FormLabel className="text-sm">Username</FormLabel>
                          <div className="bg-neutral-100 p-2 rounded-md border border-neutral-200">
                            {user.username}
                          </div>
                          <FormDescription>
                            Your username cannot be changed.
                          </FormDescription>
                        </FormItem>
                        
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to ensure your account stays secure.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 6 characters long.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={updatePasswordMutation.isPending || !passwordForm.formState.isDirty}
                        >
                          {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Configure how you receive notifications from TravelCloud.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Form {...notificationsForm}>
                      <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <FormField
                            control={notificationsForm.control}
                            name="emailNotifications"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base flex items-center">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email Notifications
                                  </FormLabel>
                                  <FormDescription>
                                    Receive email notifications for important updates.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationsForm.control}
                            name="tripReminders"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Trip Reminders</FormLabel>
                                  <FormDescription>
                                    Get reminders before your upcoming trips.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationsForm.control}
                            name="packingReminders"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Packing Reminders</FormLabel>
                                  <FormDescription>
                                    Receive reminders to complete your packing list.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationsForm.control}
                            name="weatherAlerts"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Weather Alerts</FormLabel>
                                  <FormDescription>
                                    Get notified about significant weather changes at your destination.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationsForm.control}
                            name="marketingEmails"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Marketing Emails</FormLabel>
                                  <FormDescription>
                                    Receive promotional emails and travel tips.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          disabled={updateNotificationsMutation.isPending || !notificationsForm.formState.isDirty}
                        >
                          {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Account Deletion */}
            <Card className="mt-8 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Delete Account</CardTitle>
                <CardDescription>
                  Permanently delete your account and all of your data.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="destructive">
                  Delete Account
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
