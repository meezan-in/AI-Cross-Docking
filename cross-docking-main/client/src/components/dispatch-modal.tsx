import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Assignment, Package, Fleet } from "@shared/schema";

interface DispatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignments: Assignment[];
  packages: Package[];
  fleet: Fleet[];
  onSuccess: () => void;
}

export default function DispatchModal({ 
  open, 
  onOpenChange, 
  assignmentId, 
  assignments, 
  packages, 
  fleet, 
  onSuccess 
}: DispatchModalProps) {
  const { toast } = useToast();
  const assignment = assignments.find(a => a.id === assignmentId);
  const pkg = assignment ? packages.find(p => p.id === assignment.packageId) : null;
  const fleetVehicle = assignment ? fleet.find(f => f.id === assignment.fleetId) : null;

  if (!assignment || !pkg || !fleetVehicle) return null;

  const handleDispatch = async () => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        onOpenChange(false);
        toast({
          title: "Success",
          description: `Package ${pkg.id} dispatched!`,
        });
        
        // Show delivery completion notification after 3 seconds
        setTimeout(() => {
          toast({
            title: "Delivery Complete",
            description: `Package ${pkg.id} delivered successfully!`,
          });
        }, 3000);
        
        onSuccess();
      }
    } catch (error) {
      console.error('Error dispatching assignment:', error);
      toast({
        title: "Error",
        description: "Failed to dispatch assignment",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dispatch Confirmation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Are you ready to dispatch this assignment?
          </p>
          
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Package</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">ID:</span> {pkg.id}</p>
                    <p><span className="font-medium">Destination:</span> {pkg.destination}</p>
                    <p><span className="font-medium">Weight:</span> {pkg.weight}kg</p>
                    <p><span className="font-medium">Priority:</span> {pkg.priority}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Fleet</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">ID:</span> {fleetVehicle.id}</p>
                    <p><span className="font-medium">Type:</span> {fleetVehicle.type}</p>
                    <p><span className="font-medium">Capacity:</span> {fleetVehicle.capacity}kg</p>
                    <p><span className="font-medium">From:</span> {fleetVehicle.currentLocation}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm">
                  <span className="font-medium">Distance:</span> {assignment.distance.toFixed(1)} km
                </p>
                <p className="text-sm">
                  <span className="font-medium">Assignment Method:</span> {assignment.method.toUpperCase()}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDispatch}
              className="bg-green-600 hover:bg-green-700"
            >
              <Truck className="h-4 w-4 mr-2" />
              Dispatch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
