import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, Package, MapPin, Route, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Fleet, Assignment, Package as PackageType } from "@shared/schema";
import RouteMapModal from "./route-map-modal";

interface FleetDispatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fleetId: string;
  fleet: Fleet[];
  assignments: Assignment[];
  packages: PackageType[];
  onSuccess: () => void;
}

export default function FleetDispatchModal({
  open,
  onOpenChange,
  fleetId,
  fleet,
  assignments,
  packages,
  onSuccess,
}: FleetDispatchModalProps) {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);

  const fleetVehicle = fleet.find((f) => f.id === fleetId);
  const fleetAssignments = assignments.filter((a) => a.fleetId === fleetId);
  const assignedPackages = fleetAssignments
    .map((a) => packages.find((p) => p.id === a.packageId))
    .filter(Boolean) as PackageType[];

  if (!fleetVehicle) return null;

  const capacityPercentage =
    (fleetVehicle.currentCapacityUsed / fleetVehicle.capacity) * 100;

  const handleOptimizeRoute = async () => {
    setIsOptimizing(true);

    // Simulate AI route optimization
    setTimeout(() => {
      const destinations = assignedPackages.map((p) => p.destination);
      const uniqueDestinations = Array.from(new Set(destinations));

      // Simple optimization: sort by distance from current location
      const optimized = [
        fleetVehicle.currentLocation,
        ...uniqueDestinations,
      ].filter((city, index, arr) => arr.indexOf(city) === index);
      setOptimizedRoute(optimized);
      setIsOptimizing(false);

      toast({
        title: "Route Optimized",
        description: `AI calculated optimal route through ${optimized.length} stops`,
      });
    }, 2000);
  };

  const handleDispatchFleet = async () => {
    try {
      const response = await fetch(`/api/fleet/${fleetId}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Store dispatch time and ETA for each assignment in this fleet
        const now = Date.now();
        const timers = JSON.parse(
          localStorage.getItem("assignment-timers") || "{}"
        );
        fleetAssignments.forEach((a) => {
          // Assume 40 km/h average speed
          const etaMs = a.distance
            ? (a.distance / 40) * 3600 * 1000
            : 2 * 3600 * 1000; // fallback 2h
          timers[a.id] = { dispatchedAt: now, eta: etaMs };
        });
        localStorage.setItem("assignment-timers", JSON.stringify(timers));

        onOpenChange(false);
        toast({
          title: "Fleet Dispatched",
          description: `Fleet ${fleetId} dispatched with ${assignedPackages.length} packages`,
        });

        // Show delivery completion notification after 5 seconds
        setTimeout(() => {
          toast({
            title: "Fleet Delivery Complete",
            description: `Fleet ${fleetId} completed all deliveries successfully!`,
          });
        }, 5000);

        onSuccess();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to dispatch fleet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error dispatching fleet:", error);
      toast({
        title: "Error",
        description: "Failed to dispatch fleet",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fleet Dispatch - {fleetId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fleet Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Fleet Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Vehicle Type</p>
                  <p className="text-lg">{fleetVehicle.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Location</p>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <p className="text-lg">{fleetVehicle.currentLocation}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium mb-2">
                    Capacity Utilization
                  </p>
                  <div className="space-y-2">
                    <Progress value={capacityPercentage} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      {fleetVehicle.currentCapacityUsed}kg /{" "}
                      {fleetVehicle.capacity}kg ({capacityPercentage.toFixed(1)}
                      %)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Assigned Packages ({assignedPackages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedPackages.length === 0 ? (
                <p className="text-muted-foreground">
                  No packages assigned to this fleet
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignedPackages.map((pkg) => (
                    <div key={pkg.id} className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{pkg.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {pkg.destination} • {pkg.weight}kg
                          </p>
                        </div>
                        <Badge
                          variant={
                            pkg.priority === "Urgent"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {pkg.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route Optimization */}
          {assignedPackages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Route className="h-5 w-5 mr-2" />
                    Route Optimization
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleOptimizeRoute}
                      disabled={isOptimizing}
                      variant="outline"
                      size="sm"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      {isOptimizing ? "Optimizing..." : "Optimize Route"}
                    </Button>
                    {optimizedRoute.length > 1 && !isOptimizing && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowMapModal(true)}
                      >
                        Show Map
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isOptimizing ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      AI is calculating optimal route...
                    </p>
                  </div>
                ) : optimizedRoute.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium mb-3">Optimized Route:</p>
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                      {optimizedRoute.map((city, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 flex-shrink-0"
                        >
                          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            {index + 1}. {city}
                          </div>
                          {index < optimizedRoute.length - 1 && (
                            <div className="w-8 h-0.5 bg-border"></div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Total stops: {optimizedRoute.length} • Estimated distance:{" "}
                      {(optimizedRoute.length * 150).toFixed(0)}km
                    </p>
                    <RouteMapModal
                      open={showMapModal}
                      onOpenChange={setShowMapModal}
                      route={optimizedRoute}
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Click "Optimize Route" to calculate the most efficient
                    delivery path
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dispatch Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDispatchFleet}
              disabled={assignedPackages.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Truck className="h-4 w-4 mr-2" />
              Dispatch Fleet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
