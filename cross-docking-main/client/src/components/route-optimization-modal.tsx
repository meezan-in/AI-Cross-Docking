import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Route } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RouteOptimizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  onSuccess: () => void;
}

export default function RouteOptimizationModal({ 
  open, 
  onOpenChange, 
  packageId, 
  onSuccess 
}: RouteOptimizationModalProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !packageId) return;

    const steps = [
      'Analyzing package requirements...',
      'Evaluating available fleet...',
      'Calculating optimal routes...',
      'Considering traffic patterns...',
      'Optimizing for efficiency...',
      'Finalizing assignment...'
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 20 + 10;
      if (currentProgress > 100) currentProgress = 100;
      
      setProgress(currentProgress);
      const stepIndex = Math.floor((currentProgress / 100) * steps.length);
      setStatus(steps[stepIndex] || 'Completing...');
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        performOptimization();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [open, packageId]);

  const performOptimization = async () => {
    try {
      const response = await fetch('/api/optimize-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Create the assignment
        const assignmentResponse = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: packageId,
            fleetId: result.fleetId,
            distance: result.distance,
            method: 'ai'
          })
        });

        if (assignmentResponse.ok) {
          setTimeout(() => {
            onOpenChange(false);
            setProgress(0);
            setStatus("Initializing...");
            toast({
              title: "Success",
              description: `AI assigned package ${packageId} to ${result.fleetId}`,
            });
            onSuccess();
          }, 1000);
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No suitable fleet found for assignment",
          variant: "destructive",
        });
        onOpenChange(false);
        setProgress(0);
        setStatus("Initializing...");
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "Error",
        description: "Failed to optimize assignment",
        variant: "destructive",
      });
      onOpenChange(false);
      setProgress(0);
      setStatus("Initializing...");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <div className="text-center space-y-6 py-6">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center route-animation">
            <Route className="text-primary-foreground h-8 w-8" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Optimizing Route</h3>
            <p className="text-muted-foreground mb-4">
              AI is calculating the most optimal route for your package...
            </p>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
