import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "next-themes";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import TripsPage from "@/pages/trips-page";
import TripDetailsPage from "@/pages/trip-details-page";
import SchedulePage from "@/pages/schedule-page";
import PackingPage from "@/pages/packing-page";
import SettingsPage from "@/pages/settings-page";
import SharedTripsPage from "@/pages/shared-trips-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/trips" component={TripsPage} />
      <ProtectedRoute path="/trips/:id" component={TripDetailsPage} />
      <ProtectedRoute path="/schedule" component={SchedulePage} />
      <ProtectedRoute path="/packing" component={PackingPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/shared" component={SharedTripsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
