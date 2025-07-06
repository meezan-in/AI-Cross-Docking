import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import { useEffect } from "react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) setLocation("/");
  }, [setLocation]);
  // Only render if token exists
  return localStorage.getItem("admin_token") ? <Component {...rest} /> : null;
}

function logout() {
  localStorage.removeItem("admin_token");
  window.location.href = "/";
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route
        path="/dashboard"
        component={() => <ProtectedRoute component={Dashboard} />}
      />
      <Route component={Login} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
export { logout };
