import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "../hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("admin_token", data.token);
      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.username}!`,
      });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
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
                  <label className="block mb-1 font-medium">Username</label>
                  <input
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Password</label>
                  <input
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition"
                  disabled={loading}
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
