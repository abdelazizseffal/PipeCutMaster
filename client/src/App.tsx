import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Header } from "@/components/layout/Header";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import SubscriptionPage from "@/pages/subscription-page";
import AdminIndexPage from "@/pages/admin";
import AdminUsersPage from "@/pages/admin/users";
import AdminJobsPage from "@/pages/admin/jobs";
import AdminActivityPage from "@/pages/admin/activity";
import AdminSubscriptionPlansPage from "@/pages/admin/subscription-plans";
import SuperAdminPage from "@/pages/admin/super-admin";
import ProfilePage from "@/pages/profile";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/subscriptions" component={SubscriptionPage} />
      <ProtectedRoute path="/admin" component={AdminIndexPage} />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <ProtectedRoute path="/admin/jobs" component={AdminJobsPage} />
      <ProtectedRoute path="/admin/activity" component={AdminActivityPage} />
      <ProtectedRoute path="/admin/subscription-plans" component={AdminSubscriptionPlansPage} />
      <ProtectedRoute path="/admin/super-admin" component={SuperAdminPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <div className="min-h-screen bg-neutral-light flex flex-col">
              <Header />
              <main className="flex-1">
                <Router />
              </main>
            </div>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
