import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPackageSchema,
  insertFleetSchema,
  insertAssignmentSchema,
} from "@shared/schema";
import { z } from "zod";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import csv from "csvtojson";
import { Parser as CsvParser } from "json2csv";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

function generateId(prefix: string): string {
  return prefix + Date.now() + Math.random().toString(36).substr(2, 5);
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await storage.connect();

  // Package routes
  app.get("/api/packages", async (_req, res) => {
    try {
      const packages = await storage.getPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  app.post("/api/packages", async (req, res) => {
    try {
      const validatedData = insertPackageSchema.parse(req.body);

      // Check if package ID already exists
      const existing = await storage.getPackage(validatedData.id);
      if (existing) {
        return res.status(400).json({ error: "Package ID already exists" });
      }

      const packageData = await storage.createPackage(validatedData);
      res.status(201).json(packageData);
    } catch (error) {
      console.error("Error creating package:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Invalid package data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create package" });
      }
    }
  });

  app.delete("/api/packages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deletePackage(id);

      if (success) {
        // Also delete related assignments
        const assignments = await storage.getAssignments();
        const relatedAssignments = assignments.filter(
          (a) => a.packageId === id
        );

        for (const assignment of relatedAssignments) {
          await storage.deleteAssignment(assignment.id);
          // Reset fleet status
          await storage.updateFleetVehicle(assignment.fleetId, {
            status: "Available",
          });
        }

        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Package not found" });
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ error: "Failed to delete package" });
    }
  });

  // Fleet routes
  app.get("/api/fleet", async (_req, res) => {
    try {
      const fleet = await storage.getFleet();
      res.json(fleet);
    } catch (error) {
      console.error("Error fetching fleet:", error);
      res.status(500).json({ error: "Failed to fetch fleet" });
    }
  });

  app.post("/api/fleet", async (req, res) => {
    try {
      const validatedData = insertFleetSchema.parse(req.body);

      // Check if fleet ID already exists
      const existing = await storage.getFleetVehicle(validatedData.id);
      if (existing) {
        return res.status(400).json({ error: "Fleet ID already exists" });
      }

      const fleetData = await storage.createFleetVehicle(validatedData);
      res.status(201).json(fleetData);
    } catch (error) {
      console.error("Error creating fleet vehicle:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Invalid fleet data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create fleet vehicle" });
      }
    }
  });

  app.delete("/api/fleet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFleetVehicle(id);

      if (success) {
        // Also delete related assignments
        const assignments = await storage.getAssignments();
        const relatedAssignments = assignments.filter((a) => a.fleetId === id);

        for (const assignment of relatedAssignments) {
          await storage.deleteAssignment(assignment.id);
          // Reset package status
          await storage.updatePackage(assignment.packageId, {
            status: "Pending",
          });
        }

        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Fleet vehicle not found" });
      }
    } catch (error) {
      console.error("Error deleting fleet vehicle:", error);
      res.status(500).json({ error: "Failed to delete fleet vehicle" });
    }
  });

  // Assignment routes
  app.get("/api/assignments", async (_req, res) => {
    try {
      const assignments = await storage.getAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const assignmentData = {
        ...req.body,
        id: generateId("A"),
      };

      const validatedData = insertAssignmentSchema.parse(assignmentData);

      // Get package and fleet data
      const pkg = await storage.getPackage(validatedData.packageId);
      const fleet = await storage.getFleetVehicle(validatedData.fleetId);

      if (!pkg || !fleet) {
        return res.status(404).json({ error: "Package or fleet not found" });
      }

      // Calculate new capacity usage
      const newCapacityUsed = fleet.currentCapacityUsed + pkg.weight;
      let newStatus = fleet.status;

      if (newCapacityUsed >= fleet.capacity) {
        newStatus = "Fully Loaded";
      } else if (newCapacityUsed > 0) {
        newStatus = "Partially Loaded";
      }

      // Update package and fleet status
      await storage.updatePackage(validatedData.packageId, {
        status: "Assigned",
      });
      await storage.updateFleetVehicle(validatedData.fleetId, {
        status: newStatus,
        currentCapacityUsed: newCapacityUsed,
      });

      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Invalid assignment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create assignment" });
      }
    }
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.getAssignment(id);

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Get package and fleet data to update capacity
      const pkg = await storage.getPackage(assignment.packageId);
      const fleet = await storage.getFleetVehicle(assignment.fleetId);

      if (pkg && fleet) {
        const newCapacityUsed = Math.max(
          0,
          fleet.currentCapacityUsed - pkg.weight
        );
        let newStatus:
          | "Available"
          | "Partially Loaded"
          | "Fully Loaded"
          | "En Route"
          | "Loading"
          | "Maintenance" = "Available";

        if (newCapacityUsed > 0) {
          newStatus =
            newCapacityUsed >= fleet.capacity
              ? "Fully Loaded"
              : "Partially Loaded";
        }

        // Reset package and update fleet capacity
        await storage.updatePackage(assignment.packageId, {
          status: "Pending",
        });
        await storage.updateFleetVehicle(assignment.fleetId, {
          status: newStatus,
          currentCapacityUsed: newCapacityUsed,
        });
      }

      const success = await storage.deleteAssignment(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });

  app.post("/api/assignments/:id/dispatch", async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.getAssignment(id);

      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Update statuses for dispatch
      await storage.updatePackage(assignment.packageId, {
        status: "In Transit",
      });
      await storage.updateFleetVehicle(assignment.fleetId, {
        status: "En Route",
      });
      await storage.updateAssignment(id, { status: "Dispatched" });

      // Simulate delivery completion after 3 seconds
      setTimeout(async () => {
        try {
          const pkg = await storage.getPackage(assignment.packageId);
          const fleet = await storage.getFleetVehicle(assignment.fleetId);

          if (pkg && fleet) {
            await storage.updatePackage(assignment.packageId, {
              status: "Delivered",
            });
            await storage.updateFleetVehicle(assignment.fleetId, {
              status: "Available",
              currentLocation: pkg.destination,
            });
            await storage.deleteAssignment(id);
          }
        } catch (error) {
          console.error("Error completing delivery:", error);
        }
      }, 3000);

      res.json({ success: true });
    } catch (error) {
      console.error("Error dispatching assignment:", error);
      res.status(500).json({ error: "Failed to dispatch assignment" });
    }
  });

  // Fleet dispatch endpoint
  app.post("/api/fleet/:id/dispatch", async (req, res) => {
    try {
      const { id } = req.params;
      const fleetVehicle = await storage.getFleetVehicle(id);

      if (!fleetVehicle) {
        return res.status(404).json({ error: "Fleet not found" });
      }

      // Get all assignments for this fleet
      const assignments = await storage.getAssignments();
      const fleetAssignments = assignments.filter((a) => a.fleetId === id);

      if (fleetAssignments.length === 0) {
        return res
          .status(400)
          .json({ error: "No assignments found for this fleet" });
      }

      // Dispatch all assignments
      for (const assignment of fleetAssignments) {
        await storage.updatePackage(assignment.packageId, {
          status: "In Transit",
        });
        await storage.updateAssignment(assignment.id, { status: "Dispatched" });
      }

      // Update fleet status
      await storage.updateFleetVehicle(id, { status: "En Route" });

      // Simulate delivery completion after 5 seconds
      setTimeout(async () => {
        try {
          for (const assignment of fleetAssignments) {
            const pkg = await storage.getPackage(assignment.packageId);
            if (pkg) {
              await storage.updatePackage(assignment.packageId, {
                status: "Delivered",
              });
              await storage.deleteAssignment(assignment.id);
            }
          }

          // Reset fleet
          await storage.updateFleetVehicle(id, {
            status: "Available",
            currentCapacityUsed: 0,
            currentLocation: fleetAssignments[0]
              ? (
                  await storage.getPackage(fleetAssignments[0].packageId)
                )?.destination || "Bengaluru"
              : "Bengaluru",
          });
        } catch (error) {
          console.error("Error completing fleet delivery:", error);
        }
      }, 5000);

      res.json({
        success: true,
        dispatchedAssignments: fleetAssignments.length,
      });
    } catch (error) {
      console.error("Error dispatching fleet:", error);
      res.status(500).json({ error: "Failed to dispatch fleet" });
    }
  });

  // AI optimization endpoint
  app.post("/api/optimize-assignment", async (req, res) => {
    try {
      const { packageId } = req.body;

      const pkg = await storage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ error: "Package not found" });
      }

      const fleet = await storage.getFleet();
      const availableFleet = fleet.filter(
        (f) => f.status === "Available" || f.status === "Partially Loaded"
      );

      if (availableFleet.length === 0) {
        return res.status(400).json({ error: "No available fleet vehicles" });
      }

      // AI optimization logic (simplified version of the notebook algorithm)
      const indianCities: Record<string, { lat: number; lon: number }> = {
        Bengaluru: { lat: 12.9716, lon: 77.5946 },
        Mumbai: { lat: 19.076, lon: 72.8777 },
        Delhi: { lat: 28.7041, lon: 77.1025 },
        Chennai: { lat: 13.0827, lon: 80.2707 },
        Kolkata: { lat: 22.5726, lon: 88.3639 },
        Hyderabad: { lat: 17.385, lon: 78.4867 },
        Pune: { lat: 18.5204, lon: 73.8567 },
        Ahmedabad: { lat: 23.0225, lon: 72.5714 },
        Surat: { lat: 21.1702, lon: 72.8311 },
        Jaipur: { lat: 26.9124, lon: 75.7873 },
        Lucknow: { lat: 26.8467, lon: 80.9462 },
        Kanpur: { lat: 26.4499, lon: 80.3319 },
        Nagpur: { lat: 21.1458, lon: 79.0882 },
        Indore: { lat: 22.7196, lon: 75.8577 },
        Bhopal: { lat: 23.2599, lon: 77.4126 },
        Visakhapatnam: { lat: 17.6868, lon: 83.2185 },
        Kochi: { lat: 9.9312, lon: 76.2673 },
        Coimbatore: { lat: 11.0168, lon: 76.9558 },
        Mysore: { lat: 12.2958, lon: 76.6394 },
      };

      const calculateDistance = (city1: string, city2: string): number => {
        const coords1 = indianCities[city1];
        const coords2 = indianCities[city2];
        if (!coords1 || !coords2) return 0;

        const R = 6371; // Earth's radius in km
        const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
        const dLon = ((coords2.lon - coords1.lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((coords1.lat * Math.PI) / 180) *
            Math.cos((coords2.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      let bestFleet = null;
      let bestScore = -1;

      for (const f of availableFleet) {
        // Check if fleet has enough remaining capacity
        const remainingCapacity = f.capacity - (f.currentCapacityUsed || 0);
        if (remainingCapacity < pkg.weight) {
          continue; // Skip this fleet if it can't accommodate the package
        }

        const distance = calculateDistance(f.currentLocation, pkg.destination);
        const capacityUtilization = pkg.weight / remainingCapacity;
        const priorityWeight =
          {
            Low: 1,
            Medium: 1.2,
            High: 1.5,
            Urgent: 2,
          }[pkg.priority] || 1;

        // Scoring algorithm (higher is better)
        const distanceScore = Math.max(0, 1000 - distance) / 1000;
        const capacityScore = Math.min(capacityUtilization * 2, 1);
        const availabilityScore = remainingCapacity / f.capacity; // Favor less loaded trucks

        const totalScore =
          (distanceScore * 0.4 +
            capacityScore * 0.3 +
            availabilityScore * 0.3) *
          priorityWeight;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestFleet = f;
        }
      }

      if (bestFleet) {
        const distance = calculateDistance(
          bestFleet.currentLocation,
          pkg.destination
        );
        res.json({
          fleetId: bestFleet.id,
          distance,
          score: bestScore,
          reason: `Optimal fleet selected based on distance (${distance.toFixed(
            1
          )}km), capacity utilization, and priority weighting`,
        });
      } else {
        res
          .status(400)
          .json({ error: "No suitable fleet found with enough capacity" });
      }
    } catch (error) {
      console.error("Error optimizing assignment:", error);
      res.status(500).json({ error: "Failed to optimize assignment" });
    }
  });

  app.post("/api/optimize-route", async (req, res) => {
    try {
      const { cities } = req.body;
      if (!Array.isArray(cities) || cities.length < 2) {
        return res.status(400).json({ error: "At least two cities required" });
      }
      const py = spawn("python", [__dirname + "/../ai/route_optimizer.py"]);
      let output = "";
      py.stdout.on("data", (data) => {
        output += data.toString();
      });
      py.stderr.on("data", (data) => {
        console.error("Python error:", data.toString());
      });
      py.stdin.write(JSON.stringify({ cities }));
      py.stdin.end();
      py.on("close", (code) => {
        try {
          const result = JSON.parse(output);
          if (result.error) {
            res.status(500).json({ error: result.error });
          } else {
            res.json(result);
          }
        } catch (e) {
          res.status(500).json({ error: "Failed to parse optimizer output" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Route optimization failed" });
    }
  });

  // Fleet assignment endpoint (AI/ML)
  app.post("/api/assign-fleet", async (req, res) => {
    try {
      const { fleets, package: pkg } = req.body;
      if (!Array.isArray(fleets) || !pkg) {
        return res.status(400).json({ error: "Fleets and package required" });
      }
      const py = spawn("python", [
        __dirname + "/../ai/fleet_assign_predictor.py",
      ]);
      let output = "";
      let errorOutput = "";
      py.stdout.on("data", (data) => {
        output += data.toString();
      });
      py.stderr.on("data", (data) => {
        errorOutput += data.toString();
        console.error("Python error:", data.toString());
      });
      py.stdin.write(JSON.stringify({ fleets, package: pkg }));
      py.stdin.end();
      py.on("close", (code) => {
        try {
          if (errorOutput) {
            // If there was any stderr output, return it for debugging
            return res.status(500).json({ error: errorOutput.trim() });
          }
          const result = JSON.parse(output);
          if (result.error) {
            res.status(500).json({ error: result.error });
          } else {
            res.json(result);
          }
        } catch (e) {
          res.status(500).json({
            error:
              "Failed to parse fleet assigner output: " +
              (errorOutput || e.message),
          });
        }
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Fleet assignment failed: " + error.message });
    }
  });

  // ETA prediction endpoint (AI/ML)
  app.post("/api/predict-eta", async (req, res) => {
    try {
      const { features } = req.body;
      if (!Array.isArray(features)) {
        return res.status(400).json({ error: "Features array required" });
      }
      const py = spawn("python", [__dirname + "/../ai/eta_predictor.py"]);
      let output = "";
      let errorOutput = "";
      py.stdout.on("data", (data) => {
        output += data.toString();
      });
      py.stderr.on("data", (data) => {
        errorOutput += data.toString();
        console.error("Python error:", data.toString());
      });
      py.stdin.write(JSON.stringify({ features }));
      py.stdin.end();
      py.on("close", (code) => {
        try {
          if (errorOutput) {
            // If there was any stderr output, return it for debugging
            return res.status(500).json({ error: errorOutput.trim() });
          }
          const result = JSON.parse(output);
          if (result.error) {
            res.status(500).json({ error: result.error });
          } else {
            res.json(result);
          }
        } catch (e) {
          res.status(500).json({
            error:
              "Failed to parse ETA predictor output: " +
              (errorOutput || e.message),
          });
        }
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "ETA prediction failed: " + error.message });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.getAdminUser(username);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    await storage.updateAdminUser(username, { lastLogin: new Date() });
    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token, user: { username: user.username, role: user.role } });
  });

  // Get current admin info
  app.get("/api/admin/me", authMiddleware, async (req, res) => {
    const user = await storage.getAdminUser(req.admin.username);
    if (!user) return res.status(401).json({ error: "Not found" });
    res.json({ username: user.username, role: user.role });
  });

  // Scheduled tasks CRUD
  app.get("/api/scheduled-tasks", authMiddleware, async (req, res) => {
    res.json(await storage.getScheduledTasks());
  });
  app.post("/api/scheduled-tasks", authMiddleware, async (req, res) => {
    res.json(await storage.createScheduledTask(req.body));
  });
  app.put("/api/scheduled-tasks/:id", authMiddleware, async (req, res) => {
    res.json(await storage.updateScheduledTask(req.params.id, req.body));
  });

  // Bulk import/export for packages (CSV)
  const upload = multer();

  app.post(
    "/api/packages/import",
    authMiddleware,
    upload.single("file"),
    async (req, res) => {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const jsonArr = await csv().fromString(req.file.buffer.toString());
      const results = [];
      for (const row of jsonArr) {
        try {
          // Map and sanitize fields
          const id = (row.packageId || row.id || "").toString().trim();
          const destination = (row.destination || "").toString().trim();
          const weight = Number((row.weight || "").toString().trim());
          const priority = (row.priority || "").toString().trim();
          const status = (row.status || "Pending").toString().trim();
          if (!id || !destination || !weight || !priority) {
            throw new Error(
              "Missing required fields (id, destination, weight, priority)"
            );
          }
          const pkg = { id, destination, weight, priority, status };
          await storage.createPackage(pkg);
          results.push({ id: pkg.id, status: "imported" });
        } catch (e) {
          results.push({
            id: row.packageId || row.id,
            status: "error",
            error: e.message,
          });
        }
      }
      res.json({ results });
    }
  );

  app.get("/api/packages/export", authMiddleware, async (req, res) => {
    const packages = await storage.getPackages();
    const fleet = await storage.getFleet();
    const assignments = await storage.getAssignments();
    const parser = new CsvParser();
    let csvData = "";
    if (packages.length > 0) {
      csvData += "Packages\n" + parser.parse(packages) + "\n\n";
    } else {
      csvData += "Packages\nNo data\n\n";
    }
    if (fleet.length > 0) {
      csvData += "Fleet\n" + parser.parse(fleet) + "\n\n";
    } else {
      csvData += "Fleet\nNo data\n\n";
    }
    if (assignments.length > 0) {
      csvData += "Assignments\n" + parser.parse(assignments) + "\n";
    } else {
      csvData += "Assignments\nNo data\n";
    }
    res.header("Content-Type", "text/csv");
    res.attachment("all_data.csv");
    res.send(csvData);
  });

  // Analytics endpoints
  app.get("/api/analytics/summary", authMiddleware, async (req, res) => {
    const packages = await storage.getPackages();
    const fleet = await storage.getFleet();
    const assignments = await storage.getAssignments();
    // Example summary
    res.json({
      totalPackages: packages.length,
      delivered: packages.filter((p) => p.status === "Delivered").length,
      pending: packages.filter((p) => p.status === "Pending").length,
      fleetAvailable: fleet.filter((f) => f.status === "Available").length,
      assignments: assignments.length,
    });
  });

  app.get("/api/analytics/report", authMiddleware, async (req, res) => {
    // Example: export all assignments as CSV
    const assignments = await storage.getAssignments();
    const parser = new CsvParser();
    const csvData = parser.parse(assignments);
    res.header("Content-Type", "text/csv");
    res.attachment("assignments_report.csv");
    res.send(csvData);
  });

  app.delete("/api/packages", async (req, res) => {
    try {
      // Get all packages and their IDs
      const packages = await storage.getPackages();
      const packageIds = packages.map((p) => p.id);

      // Delete all assignments related to these packages
      await storage.deleteAssignmentsByPackageIds(packageIds);

      // Optionally, reset fleet status for all affected fleets
      const assignments = await storage.getAssignments();
      const affectedFleetIds = Array.from(
        new Set(
          assignments
            .filter((a) => packageIds.includes(a.packageId))
            .map((a) => a.fleetId)
        )
      );
      for (const fleetId of affectedFleetIds) {
        await storage.updateFleetVehicle(fleetId, {
          status: "Available",
          currentCapacityUsed: 0,
        });
      }

      // Delete all packages
      const deletedCount = await storage.deleteAllPackages();
      res.json({ success: true, deletedCount });
    } catch (error) {
      console.error("Error deleting all packages:", error);
      res.status(500).json({ error: "Failed to delete all packages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
