import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Hand, Bot } from "lucide-react";
import { calculateDistance } from "@/lib/optimization";
import RouteMap from "@/components/route-map";
import type { Package, Fleet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  packages: Package[];
  fleet: Fleet[];
  onSuccess: () => void;
  onOptimize: (packageId: string) => void;
}

export default function AssignmentModal({
  open,
  onOpenChange,
  packageId,
  packages,
  fleet,
  onSuccess,
  onOptimize,
}: AssignmentModalProps) {
  const { toast } = useToast();
  const pkg = packages.find((p) => p.id === packageId);
  const availableFleet = fleet.filter((f) => {
    if (f.status === "Available") return true;
    if (f.status === "Partially Loaded") {
      const remainingCapacity = f.capacity - f.currentCapacityUsed;
      return remainingCapacity >= (pkg?.weight || 0);
    }
    return false;
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<null | {
    success: boolean;
    message: string;
  }>(null);

  if (!pkg) return null;

  const handleManualAssign = async (fleetId: string) => {
    try {
      const fleetVehicle = fleet.find((f) => f.id === fleetId);
      if (!fleetVehicle) return;

      const distance = calculateDistance(
        fleetVehicle.currentLocation,
        pkg.destination
      );

      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          fleetId: fleetId,
          distance: distance,
          method: "manual",
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
    }
  };

  const handleAIOptimize = async () => {
    if (availableFleet.length === 0) {
      toast({
        title: "No available fleet",
        description: "No fleet vehicle can carry this package.",
        variant: "destructive",
      });
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const response = await fetch("/api/assign-fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fleets: availableFleet, package: pkg }),
      });
      if (response.ok) {
        const result = await response.json();
        const bestFleet = availableFleet[result.best_fleet_index];
        if (bestFleet) {
          const distance = calculateDistance(
            bestFleet.currentLocation,
            pkg.destination
          );
          await fetch("/api/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              packageId: pkg.id,
              fleetId: bestFleet.id,
              distance: distance,
              method: "ai",
            }),
          });
          setAiResult({
            success: true,
            message: `Assigned to fleet ${bestFleet.id}`,
          });
          setTimeout(() => {
            setAiLoading(false);
            setAiResult(null);
            onOpenChange(false);
            onSuccess();
          }, 1500);
        } else {
          setAiResult({ success: false, message: "No suitable fleet found." });
          setTimeout(() => setAiLoading(false), 1500);
        }
      } else {
        const err = await response.json();
        setAiResult({ success: false, message: err.error || "Unknown error" });
        setTimeout(() => setAiLoading(false), 1500);
      }
    } catch (error) {
      setAiResult({ success: false, message: String(error) });
      setTimeout(() => setAiLoading(false), 1500);
      console.error("AI assignment error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {/* AI Assignment Animation Popup */}
        {aiLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
              <div className="mb-4">
                <span className="block w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
              </div>
              <div className="text-lg font-semibold mb-2">
                {aiResult === null
                  ? "Assigning with AI..."
                  : aiResult.success
                  ? "AI Assignment Success!"
                  : "AI Assignment Failed"}
              </div>
              <div className="text-gray-600 text-sm">
                {aiResult?.message ||
                  "Please wait while we find the best fleet."}
              </div>
            </div>
          </div>
        )}
        <DialogHeader>
          <DialogTitle>Package Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Package Details */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3">Package Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {pkg.id}
                </div>
                <div>
                  <span className="font-medium">Destination:</span>{" "}
                  {pkg.destination}
                </div>
                <div>
                  <span className="font-medium">Weight:</span> {pkg.weight}kg
                </div>
                <div>
                  <span className="font-medium">Priority:</span>
                  <Badge className="ml-2">{pkg.priority}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Options */}
          <div>
            <h4 className="font-medium mb-3">Assignment Options</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 w-full"
                onClick={() => {
                  const element = document.getElementById("manual-assignment");
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                <Hand className="h-6 w-6" />
                <span className="text-center">Assign Manually</span>
              </Button>

              <Button
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-green-600 hover:bg-green-700 w-full"
                onClick={handleAIOptimize}
              >
                <Bot className="h-6 w-6" />
                <span className="text-center">Assign Using AI</span>
              </Button>
            </div>
          </div>

          {/* Route Visualization */}
          {availableFleet.length > 0 && (
            <RouteMap
              fromCity="Bengaluru"
              toCity={pkg.destination}
              distance={calculateDistance("Bengaluru", pkg.destination)}
            />
          )}

          {/* Available Fleet for Manual Assignment */}
          <div id="manual-assignment">
            <h4 className="font-medium mb-3">Available Fleet</h4>
            {availableFleet.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  No available fleet vehicles for assignment
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {availableFleet.map((f) => {
                  const distance = calculateDistance(
                    f.currentLocation,
                    pkg.destination
                  );
                  const capacityPercentage =
                    (f.currentCapacityUsed / f.capacity) * 100;
                  const remainingCapacity = f.capacity - f.currentCapacityUsed;
                  const canAssign = remainingCapacity >= pkg.weight;
                  return (
                    <Card
                      key={f.id}
                      className={`transition-all duration-200 border-2 ${
                        canAssign
                          ? "cursor-pointer hover:bg-muted/50 hover:shadow-md hover:border-primary/20"
                          : "opacity-60 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (canAssign) handleManualAssign(f.id);
                        else
                          toast({
                            title: "Cannot assign",
                            description:
                              "Fleet does not have enough capacity for this package.",
                            variant: "destructive",
                          });
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-base">{f.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {f.type}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-primary">
                                {distance.toFixed(1)} km
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Distance
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>From: {f.currentLocation}</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Capacity</span>
                                <span>
                                  {f.currentCapacityUsed}kg / {f.capacity}kg
                                </span>
                              </div>
                              <progress
                                value={capacityPercentage}
                                className="h-1.5"
                              />
                              {f.status === "Partially Loaded" && (
                                <p className="text-xs text-orange-600 font-medium">
                                  {f.capacity - f.currentCapacityUsed}kg
                                  available
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            className="w-full text-xs py-2"
                            size="sm"
                            disabled={!canAssign}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canAssign) handleManualAssign(f.id);
                              else
                                toast({
                                  title: "Cannot assign",
                                  description:
                                    "Fleet does not have enough capacity for this package.",
                                  variant: "destructive",
                                });
                            }}
                          >
                            {canAssign
                              ? "Select This Fleet"
                              : "Not Enough Capacity"}
                          </Button>
                          {!canAssign && (
                            <div className="text-xs text-red-500 mt-1">
                              Not enough capacity
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
