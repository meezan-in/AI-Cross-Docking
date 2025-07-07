import { z } from "zod";

// Package schema
export const packageSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  destination: z.string(),
  weight: z.number().positive(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  status: z
    .enum(["Pending", "Assigned", "In Transit", "Delivered"])
    .default("Pending"),
  source: z.enum(["rfid", "manual"]).default("manual"),
  timestamp: z.string(),
});

export const insertPackageSchema = packageSchema.omit({
  _id: true,
  timestamp: true,
});

// Fleet schema
export const fleetSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  type: z.enum([
    "Small Truck",
    "Medium Truck",
    "Large Truck",
    "Container Truck",
    "Refrigerated Truck",
  ]),
  capacity: z.number().positive(),
  currentCapacityUsed: z.number().default(0),
  currentLocation: z.string(),
  status: z
    .enum([
      "Available",
      "Partially Loaded",
      "Fully Loaded",
      "En Route",
      "Loading",
      "Maintenance",
    ])
    .default("Available"),
  timestamp: z.string(),
});

export const insertFleetSchema = fleetSchema.omit({
  _id: true,
  timestamp: true,
});

// Assignment schema
export const assignmentSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  packageId: z.string(),
  fleetId: z.string(),
  distance: z.number(),
  method: z.enum(["manual", "ai"]),
  status: z.enum(["Assigned", "Dispatched", "Completed"]).default("Assigned"),
  timestamp: z.string(),
});

export const insertAssignmentSchema = assignmentSchema.omit({
  _id: true,
  timestamp: true,
});

// Type exports
export type Package = z.infer<typeof packageSchema>;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Fleet = z.infer<typeof fleetSchema>;
export type InsertFleet = z.infer<typeof insertFleetSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
