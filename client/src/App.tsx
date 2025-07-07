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
        <div
          className="min-h-screen flex flex-col relative overflow-hidden animate-gradient-bg"
          style={{
            background:
              "linear-gradient(120deg, #0f172a 0%, #2563eb 20%, #a78bfa 45%, #fb923c 70%, #f472b6 90%, #0f172a 100%)",
            backgroundSize: "300% 300%",
          }}
        >
          {/* More visible gradient accent with blue, orange, pink, purple, black */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-600 via-orange-400 via-pink-400 via-purple-400 to-black rounded-full blur-xl opacity-60 z-0" />
          <div className="relative z-10 min-h-screen flex flex-col">
            <Router />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
export { logout };
