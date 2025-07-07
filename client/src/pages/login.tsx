import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "../hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, User, Lock } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing credentials",
        description: "Username and password are required.",
        variant: "destructive",
      });
      return;
    }
    if (username.length > 64 || password.length > 128) {
      toast({
        title: "Input too long",
        description: "Username or password is too long.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      // Simulate network delay for rapid submission edge case
      await new Promise((resolve) => setTimeout(resolve, 300));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("admin_token", data.token);
      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.username}!`,
      });
      setLocation("/dashboard");
    } catch (err: any) {
      if (err.name === "TypeError") {
        toast({
          title: "Network error",
          description: "Could not connect to server. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: err.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-100/80 backdrop-blur-sm z-0" />
      <div className="max-w-md w-full space-y-8 p-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Truck className="text-white h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Bengaluru Logistic Centre
          </h2>
          <p className="mt-2 text-sm text-gray-600">Cross Docking Platform</p>
          <div className="mt-1 text-xs text-primary font-medium">
            Interdisciplinary Project
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Developed by RVCE Student
          </div>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Admin Access</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome to the logistics management platform
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium" htmlFor="username">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <User className="h-5 w-5" />
                    </span>
                    <input
                      id="username"
                      className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring placeholder-gray-400"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                      required
                      maxLength={64}
                      aria-label="Username"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-medium" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      id="password"
                      className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring placeholder-gray-400"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={128}
                      aria-label="Password"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition"
                  disabled={loading || !username.trim() || !password.trim()}
                  aria-disabled={
                    loading || !username.trim() || !password.trim()
                  }
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
