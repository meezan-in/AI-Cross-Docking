import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Truck,
  Clock,
  Route,
  Plus,
  ChartLine,
  MapPin,
  Activity,
  LogOut,
  Send,
  BarChart3,
  Users,
  Settings,
  Home,
  FileText,
  Loader2,
  Bot,
  Sun,
  Moon,
  Upload,
  Trash2,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { useLocation } from "wouter";
import type { Package as PackageType, Fleet, Assignment } from "@shared/schema";
import PackageModal from "@/components/package-modal";
import FleetModal from "@/components/fleet-modal";
import AssignmentModal from "@/components/assignment-modal";
import RouteOptimizationModal from "@/components/route-optimization-modal";
import DispatchModal from "@/components/dispatch-modal";
import FleetDispatchModal from "@/components/fleet-dispatch-modal";
import { toast } from "@/hooks/use-toast";
import { calculateDistance } from "../lib/optimization";
import { cityCoordinates } from "../lib/cities";
import { logout } from "../App";
import { Bar } from "react-chartjs-2";
import { Switch as ToggleSwitch } from "@/components/ui/switch";
import * as RadixSwitch from "@radix-ui/react-switch";
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Add global type declarations at the top
// @ts-ignore
declare global {
  interface Window {
    __ASSIGNMENTS__?: any[];
    __PACKAGES__?: any[];
  }
}

// CountdownTimer component
function CountdownTimer({ assignmentId }: { assignmentId: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [distanceZero, setDistanceZero] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let end: number | null = null;
    const storageKey = `eta_end_${assignmentId}`;
    const assignments = window.__ASSIGNMENTS__ || [];
    const packages = window.__PACKAGES__ || [];
    const assignment = assignments.find((a: any) => a.id === assignmentId);
    if (!assignment) return;
    // Only start ETA if assignment is Dispatched or In Transit
    if (
      assignment.status !== "Dispatched" &&
      assignment.status !== "In Transit"
    ) {
      setRemaining(null);
      setEta(null);
      return;
    }
    const pkg = packages.find((p: any) => p.id === assignment.packageId);
    if (!pkg) return;
    if (!assignment.distance || assignment.distance === 0) {
      setDistanceZero(true);
      setRemaining(null);
      return;
    }
    setDistanceZero(false);
    // Try to get end time from localStorage
    const storedEnd = localStorage.getItem(storageKey);
    if (storedEnd) {
      end = parseInt(storedEnd, 10);
      setRemaining(Math.max(0, end - Date.now()));
      interval = setInterval(() => {
        setRemaining(Math.max(0, end! - Date.now()));
      }, 1000);
      return () => {
        if (interval) clearInterval(interval);
      };
    }
    // Prepare features for ETA model: [distance_km, weight, priority_num, traffic_level]
    const priorityMap: Record<string, number> = {
      Low: 0,
      Medium: 1,
      High: 2,
      Urgent: 3,
    };
    const features = [
      assignment.distance || 0,
      pkg.weight || 0,
      priorityMap[String(pkg.priority)] || 0,
      2, // traffic_level: 2 = normal (default)
    ];
    const fetchEta = async () => {
      try {
        const response = await fetch("/api/predict-eta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ features }),
        });
        const result = await response.json();
        if (response.ok && result.eta_minutes) {
          setEta(result.eta_minutes * 60 * 1000); // convert minutes to ms
          end = Date.now() + result.eta_minutes * 60 * 1000;
          setRemaining(result.eta_minutes * 60 * 1000);
          localStorage.setItem(storageKey, end.toString());
          interval = setInterval(() => {
            setRemaining(Math.max(0, end! - Date.now()));
          }, 1000);
        } else {
          setEta(null);
        }
      } catch (e) {
        setEta(null);
      }
    };
    fetchEta();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [assignmentId]);

  const assignments = window.__ASSIGNMENTS__ || [];
  const assignment = assignments.find((a: any) => a.id === assignmentId);
  if (
    !assignment ||
    (assignment.status !== "Dispatched" && assignment.status !== "In Transit")
  ) {
    return (
      <span className="inline-flex items-center font-mono text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-semibold border border-gray-300">
        <Clock className="h-4 w-4 mr-1 text-gray-400" />
        Not yet dispatched
      </span>
    );
  }
  if (distanceZero)
    return (
      <span className="inline-flex items-center font-mono text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-semibold border border-gray-300">
        <Clock className="h-4 w-4 mr-1 text-gray-400" />
        ETA unavailable (missing distance)
      </span>
    );
  if (remaining === null)
    return (
      <span className="inline-flex items-center font-mono text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-semibold border border-gray-300">
        <Clock className="h-4 w-4 mr-1 text-gray-400" />
        ETA unavailable
      </span>
    );
  if (remaining <= 0)
    return (
      <span className="inline-flex items-center font-mono text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold border border-green-300">
        <Clock className="h-4 w-4 mr-1 text-green-600" />
        Arrived
      </span>
    );
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return (
    <span className="inline-flex items-center font-mono text-base bg-blue-100 text-blue-800 px-4 py-1 rounded-full font-bold border border-blue-300 shadow-sm">
      <Clock className="h-5 w-5 mr-2 text-blue-600" />
      ETA: {h}h {m}m {s}s
    </span>
  );
}

function TestSwitch() {
  const [checked, setChecked] = React.useState(false);
  return (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={setChecked}
      className="h-6 w-11 rounded-full bg-gray-300 data-[state=checked]:bg-green-500 transition relative"
      style={{ marginRight: 8 }}
    >
      <RadixSwitch.Thumb className="block h-5 w-5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
    </RadixSwitch.Root>
  );
}

// Fix handleAuthResponse parameter type
async function handleAuthResponse(res: Response) {
  if (res.status === 401) {
    toast({
      title: "Session expired",
      description: "Please log in again.",
      variant: "destructive",
    });
    setTimeout(() => {
      localStorage.removeItem("admin_token");
      window.location.href = "/";
    }, 1500);
    throw new Error("Unauthorized");
  }
  return res;
}

export default function Dashboard() {
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showFleetModal, setShowFleetModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showFleetDispatchModal, setShowFleetDispatchModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [selectedFleetId, setSelectedFleetId] = useState<string>("");
  const [, setLocation] = useLocation();
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkResult, setBulkResult] = useState<{
    success: number;
    fail: number;
  }>({ success: 0, fail: 0 });
  const [showBulkSummary, setShowBulkSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("packages");
  const [analytics, setAnalytics] = useState<any>(null);
  const [operationsTab, setOperationsTab] = useState("import");
  const [importResults, setImportResults] = useState<any[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({
    type: "auto_dispatch",
    schedule: "0 * * * *",
    enabled: true,
  });
  const { toasts } = useToast();
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);

  const {
    data: packages,
    isLoading: packagesLoading,
    isError: packagesError,
    refetch: refetchPackages,
  } = useQuery<PackageType[]>({
    queryKey: ["/api/packages"],
    refetchInterval: 3000,
  });

  const {
    data: fleet,
    isLoading: fleetLoading,
    isError: fleetError,
    refetch: refetchFleet,
  } = useQuery<Fleet[]>({
    queryKey: ["/api/fleet"],
  });

  const {
    data: assignments,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const handlePackageAssign = (packageId: string) => {
    setSelectedPackageId(packageId);
    setShowAssignmentModal(true);
  };

  const handleDispatch = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setShowDispatchModal(true);
  };

  const handleFleetDispatch = (fleetId: string) => {
    setSelectedFleetId(fleetId);
    setShowFleetDispatchModal(true);
  };

  const handleLogout = () => {
    setLocation("/");
  };

  const refetchAll = () => {
    refetchPackages();
    refetchFleet();
    refetchAssignments();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Assigned: "bg-blue-100 text-blue-800",
      "In Transit": "bg-purple-100 text-purple-800",
      Delivered: "bg-green-100 text-green-800",
      Available: "bg-green-100 text-green-800",
      "Partially Loaded": "bg-orange-100 text-orange-800",
      "Fully Loaded": "bg-red-100 text-red-800",
      "En Route": "bg-blue-100 text-blue-800",
      Loading: "bg-yellow-100 text-yellow-800",
      Maintenance: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const safePackages = packages ?? [];
  const safeFleet = fleet ?? [];
  const safeAssignments = assignments ?? [];

  const totalPackages = safePackages.length;
  const activeFleet = safeFleet.filter(
    (f) => f.status === "Available" || f.status === "Partially Loaded"
  ).length;
  const pendingAssignments = safePackages.filter(
    (p) => p.status === "Pending"
  ).length;
  const routesOptimized = safeAssignments.length;

  // Before rendering assignments, set window.__ASSIGNMENTS__ and window.__PACKAGES__
  window.__ASSIGNMENTS__ = safeAssignments;
  window.__PACKAGES__ = safePackages;

  const handleBulkAIAssign = async () => {
    const unassigned = safePackages.filter((p) => p.status === "Pending");
    if (unassigned.length === 0) {
      toast({
        title: "No unassigned packages",
        description: "All packages are already assigned.",
        variant: "destructive",
      });
      return;
    }
    setBulkAssigning(true);
    setBulkProgress(0);
    setBulkTotal(unassigned.length);
    setBulkResult({ success: 0, fail: 0 });
    let success = 0,
      fail = 0;
    for (let i = 0; i < unassigned.length; i++) {
      const pkg = unassigned[i];
      try {
        const response = await fetch("/api/assign-fleet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fleets: safeFleet, package: pkg }),
        });
        if (response.ok) {
          const result = await response.json();
          const bestFleet = safeFleet[result.best_fleet_index];
          if (bestFleet) {
            // Robust city validation and fallback with normalization
            let fromCityRaw = bestFleet.currentLocation;
            let toCityRaw = pkg.destination;
            // Normalize: trim and capitalize first letter only
            let fromCity = fromCityRaw ? fromCityRaw.trim() : "";
            let toCity = toCityRaw ? toCityRaw.trim() : "";
            // Try direct match, then case-insensitive match
            if (!cityCoordinates[fromCity]) {
              const match = Object.keys(cityCoordinates).find(
                (c) => c.toLowerCase() === fromCity.toLowerCase()
              );
              if (match) fromCity = match;
            }
            if (!cityCoordinates[toCity]) {
              const match = Object.keys(cityCoordinates).find(
                (c) => c.toLowerCase() === toCity.toLowerCase()
              );
              if (match) toCity = match;
            }
            // If fromCity and toCity are the same, allow 0 km distance and show ETA as 'Arrived', no error or toast
            let distance = 0;
            if (fromCity === toCity) {
              distance = 0;
            } else {
              try {
                if (!cityCoordinates[fromCity]) {
                  toast({
                    title: `Invalid fleet location for ${pkg.id}`,
                    description: `Fleet location '${fromCityRaw}' (normalized: '${fromCity}') is not a valid city. Falling back to Bengaluru.`,
                    variant: "destructive",
                  });
                  fromCity = "Bengaluru";
                }
                if (!cityCoordinates[toCity]) {
                  toast({
                    title: `Invalid package destination for ${pkg.id}`,
                    description: `Destination '${toCityRaw}' (normalized: '${toCity}') is not a valid city.`,
                    variant: "destructive",
                  });
                  toCity = "Bengaluru";
                }
                distance = calculateDistance(fromCity, toCity);
                if (!distance || isNaN(distance)) {
                  throw new Error(
                    `Invalid city name or coordinates: from='${fromCityRaw}' (normalized: '${fromCity}'), to='${toCityRaw}' (normalized: '${toCity}')`
                  );
                }
              } catch (err) {
                toast({
                  title: `Distance Error for ${pkg.id}`,
                  description: String(err),
                  variant: "destructive",
                });
                distance = 0;
              }
            }
            const assignRes = await fetch("/api/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                packageId: pkg.id,
                fleetId: bestFleet.id,
                distance: distance,
                method: "ai",
              }),
            });
            if (assignRes.ok) {
              success++;
            } else {
              fail++;
              const err = await assignRes.json();
              toast({
                title: `Assignment Failed for ${pkg.id}`,
                description: err.error || "Unknown error",
                variant: "destructive",
              });
            }
          } else {
            fail++;
            toast({
              title: `AI Assignment Failed for ${pkg.id}`,
              description: "No suitable fleet found.",
              variant: "destructive",
            });
          }
        } else {
          fail++;
          const err = await response.json();
          toast({
            title: `AI Assignment Failed for ${pkg.id}`,
            description: err.error || "Unknown error",
            variant: "destructive",
          });
        }
      } catch (e) {
        fail++;
        toast({
          title: `Assignment Error for ${pkg.id}`,
          description: String(e),
          variant: "destructive",
        });
      }
      setBulkProgress(i + 1);
      setBulkResult({ success, fail });
      refetchAll();
    }
    setBulkAssigning(false);
    setShowBulkSummary(true);
    setTimeout(() => setShowBulkSummary(false), 3000);
  };

  useEffect(() => {
    if (activeTab === "analytics") {
      fetch("/api/analytics/summary", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      })
        .then((res) => res.json())
        .then(setAnalytics);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "operations") {
      fetch("/api/scheduled-tasks", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      })
        .then((res) => res.json())
        .then(setScheduledTasks);
    }
  }, [activeTab]);

  // Status helpers with fallback for unknown/legacy values
  const isAssignmentInTransit = (status: string) =>
    status === "In Transit" || status === "Assigned";
  const isAssignmentDelivered = (status: string) => status === "Delivered";
  const isAssignmentCancelled = (status: string) => status === "Cancelled";
  const getAssignmentStatusLabel = (status: string) => {
    if (isAssignmentDelivered(status)) return "Delivered";
    if (isAssignmentInTransit(status)) return "In Transit/Assigned";
    if (isAssignmentCancelled(status)) return "Cancelled";
    // Fallback for unknown/legacy status values
    return status || "Unknown";
  };

  // Active Deliveries: assignments with status 'In Transit' or 'Assigned'
  const activeDeliveries = safeAssignments.filter((a) =>
    isAssignmentInTransit(a.status)
  ).length;

  // Fix fleet utilization assignment status comparison
  const fleetInUse = safeFleet.filter((f) =>
    safeAssignments.some(
      (a) => a.fleetId === f.id && isAssignmentInTransit(a.status)
    )
  ).length;
  const fleetUtilization =
    safeFleet.length > 0
      ? Math.round((fleetInUse / safeFleet.length) * 100)
      : 0;

  // Recent Error/Alert: last destructive toast
  const lastError = toasts.find((t) => t.variant === "destructive");

  // Next Scheduled Task: soonest enabled task
  let nextTask = null;
  if (scheduledTasks && scheduledTasks.length > 0) {
    const enabledTasks = scheduledTasks.filter((t) => t.enabled);
    // Sort by schedule string (assume cron, just show the first for now)
    if (enabledTasks.length > 0) {
      nextTask = enabledTasks[0];
    }
  }

  // For enhanced recent activity, add timestamps if available
  const recentActionsDetailed = safeAssignments
    .slice()
    .sort((a, b) => {
      // Fallback for missing updatedAt
      const aTime = (a as any).updatedAt
        ? new Date((a as any).updatedAt).getTime()
        : 0;
      const bTime = (b as any).updatedAt
        ? new Date((b as any).updatedAt).getTime()
        : 0;
      return bTime - aTime;
    })
    .slice(0, 5)
    .map((a) => {
      let icon = "";
      let color = "";
      let text = "";
      // TODO: Handle legacy/unknown status values
      if (isAssignmentDelivered(a.status)) {
        icon = "✅";
        color = "text-green-600";
        text = `Package ${a.packageId} delivered by Fleet ${a.fleetId}`;
      } else if (isAssignmentInTransit(a.status)) {
        icon = "🚚";
        color = "text-blue-600";
        text = `Package ${a.packageId} assigned to Fleet ${a.fleetId}`;
      } else if (isAssignmentCancelled(a.status)) {
        icon = "❌";
        color = "text-red-600";
        text = `Assignment for Package ${a.packageId} cancelled`;
      } else {
        icon = "ℹ️";
        color = "text-gray-600";
        text = `Assignment for Package ${a.packageId} (${a.status})`;
      }
      const time = (a as any).updatedAt
        ? new Date((a as any).updatedAt).toLocaleString()
        : "";
      return { icon, color, text, time };
    });

  // Calculate delivery success rate and average delivery time if possible
  const deliveredAssignments = safeAssignments.filter((a) =>
    isAssignmentDelivered(a.status)
  );
  const deliverySuccessRate =
    safeAssignments.length > 0
      ? Math.round((deliveredAssignments.length / safeAssignments.length) * 100)
      : null;
  // Placeholder for average delivery time (if ETA or timestamps available)
  const averageDeliveryTime = null; // You can calculate if you have timestamps
  // Errors in last 24h
  const now = Date.now();
  const errors24h = toasts.filter(
    (t) =>
      t.variant === "destructive" &&
      (t as any).time &&
      now - new Date((t as any).time).getTime() < 24 * 60 * 60 * 1000
  );
  // Next scheduled task countdown
  let nextTaskCountdown = null;
  if (nextTask && nextTask.schedule) {
    // Placeholder: show cron string, or if you have next run time, show countdown
    nextTaskCountdown = nextTask.schedule;
  }

  // Add delete all packages handler
  async function handleDeleteAllPackages() {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL packages? This action cannot be undone."
      )
    )
      return;
    try {
      const res = await handleAuthResponse(
        await fetch("/api/packages", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        })
      );
      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Delete All Failed",
          description: err.error || "Unknown error.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "All Packages Deleted",
        description: "All packages have been deleted successfully.",
        variant: "default",
      });
      refetchAll();
    } catch (err) {
      toast({
        title: "Delete All Error",
        description: String(err),
        variant: "destructive",
      });
    }
  }

  // Add schedule options
  const scheduleOptions = [
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every day", value: "0 0 * * *" },
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Custom", value: "custom" },
  ];
  const [scheduleOption, setScheduleOption] = useState(
    scheduleOptions[0].value
  );
  const [customSchedule, setCustomSchedule] = useState("");

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled task?"))
      return;
    try {
      const res = await fetch(`/api/scheduled-tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Delete Failed",
          description: err.error || "Unknown error.",
          variant: "destructive",
        });
        return;
      }
      // Refresh tasks
      const fetchRes = await handleAuthResponse(
        await fetch("/api/scheduled-tasks", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        })
      );
      setScheduledTasks(await fetchRes.json());
      toast({
        title: "Task Deleted",
        description: "Scheduled task deleted successfully.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Delete Error",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: any) => {
    setEditTask(task);
    setEditTaskModalOpen(true);
  };

  const handleEditTaskSave = async () => {
    if (!editTask) return;
    try {
      setTaskLoading(true);
      const res = await fetch(`/api/scheduled-tasks/${editTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(editTask),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Update Failed",
          description: err.error || "Unknown error.",
          variant: "destructive",
        });
        setTaskLoading(false);
        return;
      }
      setEditTaskModalOpen(false);
      setEditTask(null);
      // Refresh tasks
      const fetchRes = await handleAuthResponse(
        await fetch("/api/scheduled-tasks", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        })
      );
      setScheduledTasks(await fetchRes.json());
      toast({
        title: "Task Updated",
        description: "Scheduled task updated successfully.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Update Error",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setTaskLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar: Analytics & Insights Panel */}
      <div className="w-72 bg-card shadow-lg border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="text-primary-foreground h-6 w-6" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold">Logistics Centre</h1>
              <p className="text-xs text-muted-foreground">
                Cross Docking Platform
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Panel in Sidebar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Key Stats */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-col border-2 border-black transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-100 hover:to-cyan-100 hover:shadow-xl hover:scale-105 cursor-pointer">
            <div className="flex items-center mb-3">
              <span className="bg-blue-100 p-2 rounded-full mr-3">
                <Package className="h-5 w-5 text-blue-600" />
              </span>
              <div>
                <div className="text-xs text-gray-500">Total Packages</div>
                <div className="text-xl font-bold">{totalPackages}</div>
              </div>
            </div>
            <div className="flex items-center mb-3">
              <span className="bg-green-100 p-2 rounded-full mr-3">
                <Truck className="h-5 w-5 text-green-600" />
              </span>
              <div>
                <div className="text-xs text-gray-500">Active Fleet</div>
                <div className="text-xl font-bold">{activeFleet}</div>
              </div>
            </div>
            <div className="flex items-center mb-3">
              <span className="bg-purple-100 p-2 rounded-full mr-3">
                <Route className="h-5 w-5 text-purple-600" />
              </span>
              <div>
                <div className="text-xs text-gray-500">Routes Optimized</div>
                <div className="text-xl font-bold">{routesOptimized}</div>
              </div>
            </div>
          </div>
          {/* Modern Analytics Card (real metrics only) */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col border-2 border-black max-w-sm mx-auto mb-8 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-100 hover:to-cyan-100 hover:shadow-xl hover:scale-105 cursor-pointer">
            {/* Pending Packages */}
            <div className="flex items-center mb-4">
              <span className="bg-yellow-100 p-2 rounded-full mr-3">
                <Clock className="h-5 w-5 text-yellow-600" />
              </span>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Pending Packages</div>
                <div className="text-2xl font-bold">
                  {safePackages.filter((p) => p.status === "Pending").length}
                </div>
              </div>
            </div>
            {/* Assigned Packages */}
            <div className="flex items-center mb-4">
              <span className="bg-blue-100 p-2 rounded-full mr-3">
                <Send className="h-5 w-5 text-blue-600" />
              </span>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Assigned Packages</div>
                <div className="text-2xl font-bold">
                  {safePackages.filter((p) => p.status === "Assigned").length}
                </div>
              </div>
            </div>
            {/* In Transit Packages */}
            <div className="flex items-center mb-4">
              <span className="bg-purple-100 p-2 rounded-full mr-3">
                <Truck className="h-5 w-5 text-purple-600" />
              </span>
              <div className="flex-1">
                <div className="text-xs text-gray-500">In Transit Packages</div>
                <div className="text-2xl font-bold">
                  {safePackages.filter((p) => p.status === "In Transit").length}
                </div>
              </div>
            </div>
            {/* Delivered Packages */}
            <div className="flex items-center mb-4">
              <span className="bg-green-100 p-2 rounded-full mr-3">
                <Package className="h-5 w-5 text-green-600" />
              </span>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Delivered Packages</div>
                <div className="text-2xl font-bold">
                  {safePackages.filter((p) => p.status === "Delivered").length}
                </div>
              </div>
            </div>
            {/* Fleet Fill Rate */}
            <div className="flex items-center mb-4">
              <span className="bg-indigo-100 p-2 rounded-full mr-3">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </span>
              <div className="flex-1">
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Fleet Fill Rate</span>
                  <span className="font-bold">
                    {safeFleet.length > 0
                      ? `${Math.round(
                          (safeFleet.reduce(
                            (sum, f) => sum + f.currentCapacityUsed,
                            0
                          ) /
                            safeFleet.reduce((sum, f) => sum + f.capacity, 0)) *
                            100
                        )}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        safeFleet.length > 0
                          ? Math.round(
                              (safeFleet.reduce(
                                (sum, f) => sum + f.currentCapacityUsed,
                                0
                              ) /
                                safeFleet.reduce(
                                  (sum, f) => sum + f.capacity,
                                  0
                                )) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            {/* Delayed Assignments (N/A) */}
            <div className="flex items-center mb-4">
              <span className="bg-red-100 p-2 rounded-full mr-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </span>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Delayed Assignments</div>
                <div className="text-2xl font-bold">N/A</div>
              </div>
            </div>
            {/* Next Scheduled Task */}
            <div className="flex items-center">
              <span className="bg-pink-100 p-2 rounded-full mr-3">
                <Clock className="h-5 w-5 text-pink-600" />
              </span>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Next Scheduled Task</div>
                <div className="text-2xl font-bold">
                  {nextTaskCountdown ? (
                    nextTaskCountdown
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Recent Activity - prominent */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-col border-2 border-black transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-100 hover:to-cyan-100 hover:shadow-xl hover:scale-105 cursor-pointer">
            <div className="flex items-center mb-3">
              <span className="bg-gray-200 p-2 rounded-full mr-3">📝</span>
              <div className="text-lg font-bold text-gray-800">
                Recent Activity
              </div>
            </div>
            <ul className="text-sm space-y-2 mb-2">
              {recentActionsDetailed.length === 0 ? (
                <li className="text-gray-400">No recent activity</li>
              ) : (
                recentActionsDetailed.map((action, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 ${action.color}`}
                    title={action.text}
                  >
                    <span>{action.icon}</span>
                    <span className="truncate flex-1">{action.text}</span>
                    {action.time && (
                      <span className="text-xs text-gray-400 ml-2">
                        {action.time}
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
            <a
              href="#"
              className="text-blue-600 text-xs underline hover:text-blue-800"
              title="View full audit log (coming soon)"
            >
              View Audit Log
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-card shadow-sm border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              Dashboard Overview
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-primary">
                Interdisciplinary Project | RVCE
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger
                value="packages"
                className="transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-300 hover:to-yellow-200 hover:text-orange-800 hover:scale-105"
              >
                Packages
              </TabsTrigger>
              <TabsTrigger
                value="fleet"
                className="transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-300 hover:to-yellow-200 hover:text-orange-800 hover:scale-105"
              >
                Fleet
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-300 hover:to-yellow-200 hover:text-orange-800 hover:scale-105"
              >
                Assignments
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-300 hover:to-yellow-200 hover:text-orange-800 hover:scale-105"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="operations"
                className="transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-300 hover:to-yellow-200 hover:text-orange-800 hover:scale-105"
              >
                Operations
              </TabsTrigger>
            </TabsList>

            {/* Packages Tab */}
            <TabsContent value="packages">
              <Card className="border-2 border-black">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Package Management</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteAllPackages}
                      variant="destructive"
                      className="flex items-center"
                    >
                      Delete All
                    </Button>
                    <Button
                      onClick={handleBulkAIAssign}
                      variant="default"
                      className="flex items-center bg-green-500 hover:bg-green-600 text-white border-none"
                    >
                      <Bot className="h-4 w-4 mr-1 animate-bounce" />
                      Assign All with AI
                    </Button>
                    <Button onClick={() => setShowPackageModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Package
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package ID</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Weight (kg)</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Entry</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packagesLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Loading packages...
                            </TableCell>
                          </TableRow>
                        ) : packagesError ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-red-500"
                            >
                              Failed to load packages.{" "}
                              <Button
                                onClick={() => refetchPackages()}
                                size="sm"
                              >
                                Retry
                              </Button>
                            </TableCell>
                          </TableRow>
                        ) : !safePackages || safePackages.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <Package className="h-8 w-8 mx-auto mb-2" />
                              No packages available
                            </TableCell>
                          </TableRow>
                        ) : (
                          safePackages.map((pkg) => (
                            <TableRow key={pkg?.id || Math.random()}>
                              <TableCell className="font-medium">
                                {pkg?.id || (
                                  <span className="text-red-500">Invalid</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {pkg?.destination || (
                                  <span className="text-red-500">Missing</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {pkg?.weight ?? (
                                  <span className="text-red-500">Missing</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {pkg?.priority || (
                                  <span className="text-red-500">Missing</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(pkg?.status)}>
                                  {getAssignmentStatusLabel(pkg?.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    pkg?.source === "rfid"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {pkg?.source === "rfid" ? "RFID" : "Manual"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {pkg?.status === "Pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePackageAssign(pkg.id)}
                                    className="mr-2"
                                    disabled={!pkg?.id}
                                  >
                                    <Route className="h-4 w-4 mr-1" />
                                    Assign
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this package?"
                                      )
                                    ) {
                                      await fetch(`/api/packages/${pkg.id}`, {
                                        method: "DELETE",
                                      });
                                      refetchAll();
                                    }
                                  }}
                                  disabled={!pkg?.id}
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fleet Tab */}
            <TabsContent value="fleet">
              <Card className="border-2 border-black">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Fleet Management</CardTitle>
                  <Button onClick={() => setShowFleetModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fleet
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fleet ID</TableHead>
                          <TableHead>Vehicle Type</TableHead>
                          <TableHead>Capacity Utilization</TableHead>
                          <TableHead>Current Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fleetLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Loading fleet...
                            </TableCell>
                          </TableRow>
                        ) : fleetError ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-red-500"
                            >
                              Failed to load fleet.{" "}
                              <Button onClick={() => refetchFleet()} size="sm">
                                Retry
                              </Button>
                            </TableCell>
                          </TableRow>
                        ) : !safeFleet || safeFleet.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <Truck className="h-8 w-8 mx-auto mb-2" />
                              No fleet vehicles available
                            </TableCell>
                          </TableRow>
                        ) : (
                          safeFleet.map((f) => {
                            const capacityPercentage =
                              (f.currentCapacityUsed / f.capacity) * 100;
                            const hasAssignments = safeAssignments.some(
                              (a) => a.fleetId === f.id
                            );

                            return (
                              <TableRow key={f.id}>
                                <TableCell className="font-medium">
                                  {f.id}
                                </TableCell>
                                <TableCell>{f.type}</TableCell>
                                <TableCell>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>
                                        {f.currentCapacityUsed}kg / {f.capacity}
                                        kg
                                      </span>
                                      <span>
                                        {capacityPercentage.toFixed(1)}%
                                      </span>
                                    </div>
                                    <Progress
                                      value={capacityPercentage}
                                      className="h-2"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {f.currentLocation}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(f.status)}>
                                    {getAssignmentStatusLabel(f.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {hasAssignments &&
                                      (f.status === "Partially Loaded" ||
                                        f.status === "Fully Loaded") && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleFleetDispatch(f.id)
                                          }
                                          className="bg-green-50 hover:bg-green-100"
                                        >
                                          <Send className="h-4 w-4 mr-1" />
                                          Dispatch
                                        </Button>
                                      )}
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={async () => {
                                        if (
                                          confirm(
                                            "Are you sure you want to delete this fleet vehicle?"
                                          )
                                        ) {
                                          await fetch(`/api/fleet/${f.id}`, {
                                            method: "DELETE",
                                          });
                                          refetchAll();
                                        }
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2 border-black">
                  <CardHeader>
                    <CardTitle>Unassigned Packages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {safePackages.filter((p) => p.status === "Pending")
                        .length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2" />
                          <p>No unassigned packages</p>
                        </div>
                      ) : (
                        safePackages
                          .filter((p) => p.status === "Pending")
                          .map((pkg) => (
                            <div
                              key={pkg.id}
                              className="bg-muted p-4 rounded-lg flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium">{pkg.id}</p>
                                <p className="text-sm text-muted-foreground">
                                  {pkg.destination} • {pkg.weight}kg •{" "}
                                  {pkg.priority}
                                </p>
                              </div>
                              <div className="space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePackageAssign(pkg.id)}
                                >
                                  <Route className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-black">
                  <CardHeader>
                    <CardTitle>Active Assignments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {assignmentsLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Loading assignments...
                        </div>
                      ) : assignmentsError ? (
                        <div className="text-center py-8 text-red-500">
                          Failed to load assignments.{" "}
                          <Button
                            onClick={() => refetchAssignments()}
                            size="sm"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : !safeAssignments || safeAssignments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Route className="h-8 w-8 mx-auto mb-2" />
                          <p>No active assignments</p>
                        </div>
                      ) : (
                        safeAssignments.map((assignment) => {
                          const pkg = safePackages.find(
                            (p) => p.id === assignment.packageId
                          );
                          const fleetVehicle = safeFleet.find(
                            (f) => f.id === assignment.fleetId
                          );

                          return (
                            <div
                              key={assignment.id}
                              className="bg-muted p-4 rounded-lg flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium">
                                  {assignment.packageId} → {assignment.fleetId}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {pkg?.destination} • Distance:{" "}
                                  {assignment.distance?.toFixed(1)}km
                                </p>
                              </div>
                              <div className="space-x-2 flex items-center">
                                <CountdownTimer assignmentId={assignment.id} />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-1"
                                >
                                  Sync with Real GPS
                                </Button>
                                {assignment.status === "Assigned" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDispatch(assignment.id)
                                    }
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Activity className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    if (
                                      confirm(
                                        "Are you sure you want to cancel this assignment?"
                                      )
                                    ) {
                                      await fetch(
                                        `/api/assignments/${assignment.id}`,
                                        { method: "DELETE" }
                                      );
                                      refetchAll();
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  Analytics & Reporting
                </h2>
                {analytics ? (
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">
                        Total Packages
                      </div>
                      <div className="text-2xl font-bold">
                        {analytics.totalPackages}
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">
                        Delivered
                      </div>
                      <div className="text-2xl font-bold">
                        {analytics.delivered}
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">
                        Pending
                      </div>
                      <div className="text-2xl font-bold">
                        {analytics.pending}
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">
                        Fleet Available
                      </div>
                      <div className="text-2xl font-bold">
                        {analytics.fleetAvailable}
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 col-span-2">
                      <div className="text-sm text-muted-foreground">
                        Assignments
                      </div>
                      <div className="text-2xl font-bold">
                        {analytics.assignments}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>Loading analytics...</div>
                )}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">
                    Deliveries Chart (Sample)
                  </h3>
                  <Bar
                    data={{
                      labels: ["Delivered", "Pending"],
                      datasets: [
                        {
                          label: "Packages",
                          data: analytics
                            ? [analytics.delivered, analytics.pending]
                            : [0, 0],
                          backgroundColor: ["#4ade80", "#fbbf24"],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                </div>
                <button
                  className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary/90 transition"
                  onClick={() => {
                    window.open(
                      "/api/analytics/report?token=" +
                        localStorage.getItem("admin_token"),
                      "_blank"
                    );
                  }}
                >
                  Export Assignments Report (CSV)
                </button>
              </div>
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  Operations & Automation
                </h2>
                <div className="mb-6 flex space-x-4">
                  <button
                    className={`px-4 py-2 rounded font-semibold ${
                      operationsTab === "import"
                        ? "bg-primary text-white"
                        : "bg-muted"
                    }`}
                    onClick={() => setOperationsTab("import")}
                  >
                    Bulk Import/Export
                  </button>
                  <button
                    className={`px-4 py-2 rounded font-semibold ${
                      operationsTab === "tasks"
                        ? "bg-primary text-white"
                        : "bg-muted"
                    }`}
                    onClick={() => setOperationsTab("tasks")}
                  >
                    Scheduled Tasks
                  </button>
                </div>
                {operationsTab === "import" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bulk Import/Export Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Upload className="h-5 w-5 text-blue-500" /> Bulk
                        Import/Export Packages
                      </h3>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const file = (e.target as any).file.files[0];
                          if (!file) {
                            toast({
                              title: "No file selected",
                              description:
                                "Please choose a CSV file to import.",
                              variant: "destructive",
                            });
                            return;
                          }
                          // Frontend CSV validation
                          const text = await file.text();
                          const parsed = Papa.parse(text, { header: true });
                          const requiredFields = [
                            "packageId",
                            "destination",
                            "weight",
                            "priority",
                          ];
                          const invalidRows = parsed.data.filter((row: any) =>
                            requiredFields.some(
                              (field) =>
                                !row[field] || String(row[field]).trim() === ""
                            )
                          );
                          if (invalidRows.length > 0) {
                            toast({
                              title: "Invalid CSV Data",
                              description: `All rows must have packageId, destination, weight, and priority. Found ${invalidRows.length} invalid row(s).`,
                              variant: "destructive",
                            });
                            return;
                          }
                          setImportLoading(true);
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            const res = await handleAuthResponse(
                              await fetch("/api/packages/import", {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem(
                                    "admin_token"
                                  )}`,
                                },
                                body: formData,
                              })
                            );
                            const data = await res.json();
                            setImportResults(data.results || []);
                            const importedCount =
                              data.results?.filter(
                                (r: { status: string }) =>
                                  r.status === "imported"
                              ).length || 0;
                            toast({
                              title: "Import Successful",
                              description: `Imported ${importedCount} packages.`,
                              variant: "default",
                            });
                            refetchAll();
                          } catch (err) {
                            toast({
                              title: "Import Error",
                              description: String(err),
                              variant: "destructive",
                            });
                          } finally {
                            setImportLoading(false);
                          }
                        }}
                        className="mb-4"
                      >
                        <label className="block mb-2 font-medium">
                          Import Packages (CSV)
                        </label>
                        <input
                          type="file"
                          name="file"
                          accept=".csv"
                          className="mb-2"
                        />
                        <button
                          type="submit"
                          className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary/90 transition mr-2"
                          disabled={importLoading}
                        >
                          {importLoading ? "Importing..." : "Import CSV"}
                        </button>
                      </form>
                      {importResults.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-1">Import Results:</h4>
                          <ul className="text-sm">
                            {importResults.map((r, i) => (
                              <li
                                key={i}
                                className={
                                  r.status === "imported"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {r.id}: {r.status}{" "}
                                {r.error ? `- ${r.error}` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-col md:flex-row gap-2 mt-4">
                        <button
                          className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary/90 transition"
                          onClick={async () => {
                            setExportLoading(true);
                            try {
                              const res = await handleAuthResponse(
                                await fetch("/api/packages/export", {
                                  method: "GET",
                                  headers: {
                                    Authorization: `Bearer ${localStorage.getItem(
                                      "admin_token"
                                    )}`,
                                  },
                                })
                              );
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "all_data.csv";
                              a.click();
                              window.URL.revokeObjectURL(url);
                              toast({
                                title: "Export Successful",
                                description:
                                  "Your CSV export has been downloaded.",
                                variant: "default",
                              });
                            } catch (err) {
                              toast({
                                title: "Export Error",
                                description: String(err),
                                variant: "destructive",
                              });
                            } finally {
                              setExportLoading(false);
                            }
                          }}
                          disabled={exportLoading}
                        >
                          {exportLoading
                            ? "Exporting..."
                            : "Export Packages (CSV)"}
                        </button>
                        <button
                          className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition flex items-center gap-2"
                          onClick={handleDeleteAllPackages}
                        >
                          <Trash2 className="h-4 w-4" /> Delete All Packages
                        </button>
                      </div>
                      <p className="text-xs text-red-500 mt-2">
                        <AlertTriangle className="inline h-4 w-4 mr-1" />
                        <span>
                          Warning: This will permanently delete <b>all</b>{" "}
                          packages and related assignments. This action cannot
                          be undone.
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                {operationsTab === "tasks" && (
                  <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800 max-w-xl mx-auto">
                    <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                      <Clock className="h-6 w-6 text-blue-500" /> Scheduled
                      Tasks
                    </h3>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const schedule =
                          scheduleOption === "custom"
                            ? customSchedule
                            : scheduleOption;
                        setNewTask((t) => ({ ...t, schedule }));
                        setTaskLoading(true);
                        try {
                          const res = await handleAuthResponse(
                            await fetch("/api/scheduled-tasks", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${localStorage.getItem(
                                  "admin_token"
                                )}`,
                              },
                              body: JSON.stringify({ ...newTask, schedule }),
                            })
                          );
                          if (!res.ok) {
                            const err = await res.json();
                            toast({
                              title: "Task Creation Failed",
                              description: err.error || "Unknown error.",
                              variant: "destructive",
                            });
                            setTaskLoading(false);
                            return;
                          }
                          setNewTask({
                            type: "auto_dispatch",
                            schedule: scheduleOptions[0].value,
                            enabled: true,
                          });
                          setScheduleOption(scheduleOptions[0].value);
                          setCustomSchedule("");
                          // Refresh tasks
                          const fetchRes = await handleAuthResponse(
                            await fetch("/api/scheduled-tasks", {
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem(
                                  "admin_token"
                                )}`,
                              },
                            })
                          );
                          setScheduledTasks(await fetchRes.json());
                          toast({
                            title: "Task Added",
                            description: "Scheduled task added successfully.",
                            variant: "default",
                          });
                        } catch (err) {
                          toast({
                            title: "Task Error",
                            description: String(err),
                            variant: "destructive",
                          });
                        } finally {
                          setTaskLoading(false);
                        }
                      }}
                      className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center"
                    >
                      <select
                        value={newTask.type}
                        onChange={(e) =>
                          setNewTask((t) => ({ ...t, type: e.target.value }))
                        }
                        className="border rounded px-2 py-2 min-w-[120px] text-base"
                        style={{ height: "38px" }}
                      >
                        <option value="auto_dispatch">Auto Dispatch</option>
                      </select>
                      <select
                        value={scheduleOption}
                        onChange={(e) => setScheduleOption(e.target.value)}
                        className="border rounded px-2 py-2 min-w-[120px] text-base"
                        style={{ height: "38px" }}
                      >
                        {scheduleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {scheduleOption === "custom" ? (
                        <input
                          type="text"
                          value={customSchedule}
                          onChange={(e) => setCustomSchedule(e.target.value)}
                          placeholder="Cron schedule (e.g. 0 * * * *)"
                          className="border rounded px-2 py-2 min-w-[150px] text-base"
                          style={{ height: "38px" }}
                        />
                      ) : null}
                      <button
                        type="submit"
                        className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary/90 transition w-full md:w-auto"
                        disabled={taskLoading}
                        style={{ height: "38px" }}
                      >
                        {taskLoading ? "Adding..." : "Add Task"}
                      </button>
                    </form>
                    <table className="w-full text-sm border rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-muted text-base">
                          <th className="p-2">Type</th>
                          <th className="p-2">Schedule</th>
                          <th className="p-2">Enabled</th>
                          <th className="p-2">Last Run</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledTasks.map((task, i) => (
                          <tr
                            key={i}
                            className="border-t hover:bg-muted/50 transition"
                          >
                            <td className="p-2">
                              <Badge
                                variant={
                                  task.type === "auto_dispatch"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-sm px-3 py-1"
                              >
                                {task.type === "auto_dispatch"
                                  ? "Auto Dispatch"
                                  : "Report Generation"}
                              </Badge>
                            </td>
                            <td className="p-2 font-mono text-sm">
                              {task.schedule}
                            </td>
                            <td className="p-2">
                              <Badge
                                variant={task.enabled ? "default" : "outline"}
                                className="text-sm px-3 py-1"
                              >
                                {task.enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </td>
                            <td className="p-2 text-sm">
                              {task.lastRun
                                ? new Date(task.lastRun).toLocaleString()
                                : "-"}
                            </td>
                            <td className="p-2 flex gap-2">
                              <button
                                title="Edit Task"
                                className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                                onClick={() => handleEditTask(task)}
                              >
                                <Edit className="h-4 w-4 text-blue-500" />
                              </button>
                              <button
                                title="Delete Task"
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                                onClick={() => handleDeleteTask(task._id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <PackageModal
        open={showPackageModal}
        onOpenChange={setShowPackageModal}
        onSuccess={refetchAll}
      />

      <FleetModal
        open={showFleetModal}
        onOpenChange={setShowFleetModal}
        onSuccess={refetchAll}
      />

      <AssignmentModal
        open={showAssignmentModal}
        onOpenChange={setShowAssignmentModal}
        packageId={selectedPackageId}
        packages={safePackages}
        fleet={safeFleet}
        onSuccess={refetchAll}
        onOptimize={(packageId) => {
          setSelectedPackageId(packageId);
          setShowOptimizationModal(true);
        }}
      />

      <RouteOptimizationModal
        open={showOptimizationModal}
        onOpenChange={setShowOptimizationModal}
        packageId={selectedPackageId}
        onSuccess={refetchAll}
      />

      <DispatchModal
        open={showDispatchModal}
        onOpenChange={setShowDispatchModal}
        assignmentId={selectedAssignmentId}
        assignments={safeAssignments}
        packages={safePackages}
        fleet={safeFleet}
        onSuccess={refetchAll}
      />

      <FleetDispatchModal
        open={showFleetDispatchModal}
        onOpenChange={setShowFleetDispatchModal}
        fleetId={selectedFleetId}
        fleet={safeFleet}
        assignments={safeAssignments}
        packages={safePackages}
        onSuccess={refetchAll}
      />

      {/* Bulk AI Assignment Animation Modal */}
      {bulkAssigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <div className="text-lg font-semibold mb-2">
              Assigning All Packages with AI...
            </div>
            <div className="text-gray-600 text-sm mb-2">
              {bulkProgress} / {bulkTotal} assigned
            </div>
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${(bulkProgress / Math.max(1, bulkTotal)) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-500">
              This may take a few seconds.
            </div>
          </div>
        </div>
      )}
      {showBulkSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <div className="text-2xl font-bold mb-2">
              Bulk Assignment Complete
            </div>
            <div className="text-lg mb-2">
              ✅ {bulkResult.success} Success &nbsp; ❌ {bulkResult.fail} Failed
            </div>
            <Button onClick={() => setShowBulkSummary(false)} className="mt-2">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Edit Scheduled Task Modal */}
      <Dialog open={editTaskModalOpen} onOpenChange={setEditTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Scheduled Task</DialogTitle>
          </DialogHeader>
          {editTask && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditTaskSave();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block mb-1 font-medium">Type</label>
                <select
                  value={editTask.type}
                  onChange={(e) =>
                    setEditTask({ ...editTask, type: e.target.value })
                  }
                  className="border rounded px-2 py-2 min-w-[120px] text-base"
                >
                  <option value="auto_dispatch">Auto Dispatch</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Schedule (cron)
                </label>
                <input
                  type="text"
                  value={editTask.schedule}
                  onChange={(e) =>
                    setEditTask({ ...editTask, schedule: e.target.value })
                  }
                  className="border rounded px-2 py-2 min-w-[150px] text-base"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Enabled</label>
                <select
                  value={editTask.enabled ? "true" : "false"}
                  onChange={(e) =>
                    setEditTask({
                      ...editTask,
                      enabled: e.target.value === "true",
                    })
                  }
                  className="border rounded px-2 py-2 min-w-[100px] text-base"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={taskLoading}>
                  {taskLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
