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
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 mt-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center mb-4">
            <div className="h-20 w-20 rounded-full flex items-center justify-center ring-4 ring-black bg-primary shadow-lg shadow-blue-400/30">
              <Truck className="text-white h-10 w-10" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bengaluru Logistic Centre
          </h2>
          <p className="mt-2 text-lg text-white font-medium drop-shadow">
            Cross Docking Platform
          </p>
          <div className="mt-1 text-base font-bold text-black drop-shadow">
            Interdisciplinary Project
          </div>
          <div className="text-base text-white font-medium mt-1 drop-shadow">
            Developed by RVCE Student
          </div>
        </div>
        <Card className="shadow-xl border-4 border-black rounded-2xl bg-white transition-all duration-500 animate-fade-in">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-2xl font-semibold mb-1">Admin Access</h3>
                <p className="text-base text-gray-600 font-light">
                  Welcome to the logistics management platform
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    className="block mb-2 font-semibold text-left"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-300">
                      <User className="h-5 w-5" />
                    </span>
                    <input
                      id="username"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200 hover:border-blue-300 shadow-sm transition placeholder-gray-400 text-base outline-none"
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
                  <label
                    className="block mb-2 font-semibold text-left"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-300">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      id="password"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200 hover:border-blue-300 shadow-sm transition placeholder-gray-400 text-base outline-none"
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
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:scale-105 transition text-lg mt-2"
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
