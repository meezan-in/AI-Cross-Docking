import { MongoClient, Db, Collection } from "mongodb";
import type {
  Package,
  Fleet,
  Assignment,
  InsertPackage,
  InsertFleet,
  InsertAssignment,
} from "@shared/schema";
import { ObjectId } from "mongodb";

export interface IStorage {
  // Package operations
  getPackages(): Promise<Package[]>;
  getPackage(id: string): Promise<Package | null>;
  createPackage(packageData: any): Promise<Package>;
  updatePackage(id: string, updates: Partial<Package>): Promise<Package | null>;
  deletePackage(id: string): Promise<boolean>;
  deleteAllPackages(): Promise<number>;
  deleteAssignmentsByPackageIds(packageIds: string[]): Promise<number>;

  // Fleet operations
  getFleet(): Promise<Fleet[]>;
  getFleetVehicle(id: string): Promise<Fleet | null>;
  createFleetVehicle(fleetData: InsertFleet): Promise<Fleet>;
  updateFleetVehicle(
    id: string,
    updates: Partial<Fleet>
  ): Promise<Fleet | null>;
  deleteFleetVehicle(id: string): Promise<boolean>;

  // Assignment operations
  getAssignments(): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | null>;
  createAssignment(assignmentData: InsertAssignment): Promise<Assignment>;
  updateAssignment(
    id: string,
    updates: Partial<Assignment>
  ): Promise<Assignment | null>;
  deleteAssignment(id: string): Promise<boolean>;

  // User (Admin) operations
  getAdminUser(username: string): Promise<AdminUser | null>;
  createAdminUser(user: AdminUser): Promise<AdminUser>;
  updateAdminUser(
    username: string,
    updates: Partial<AdminUser>
  ): Promise<AdminUser | null>;

  // Scheduled Task operations
  getScheduledTasks(): Promise<ScheduledTask[]>;
  createScheduledTask(task: ScheduledTask): Promise<ScheduledTask>;
  updateScheduledTask(
    id: string,
    updates: Partial<ScheduledTask>
  ): Promise<ScheduledTask | null>;
  deleteScheduledTask(id: string): Promise<boolean>;
}

export interface AdminUser {
  _id?: string;
  username: string;
  passwordHash: string;
  role: "admin";
  createdAt: Date;
  lastLogin?: Date;
}

export interface ScheduledTask {
  _id?: string;
  type: string; // e.g., 'auto_dispatch', 'report_generation'
  schedule: string; // cron format
  enabled: boolean;
  lastRun?: Date;
  config?: any;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private packages: Collection<Package>;
  private fleet: Collection<Fleet>;
  private assignments: Collection<Assignment>;
  private users: Collection<AdminUser>;
  private scheduledTasks: Collection<ScheduledTask>;

  constructor() {
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb+srv://logistics-manager:hello123@cluster0.dczks2z.mongodb.net/";
    this.client = new MongoClient(mongoUri);
    this.db = this.client.db("bengaluru-logistics");
    this.packages = this.db.collection("packages");
    this.fleet = this.db.collection("fleet");
    this.assignments = this.db.collection("assignments");
    this.users = this.db.collection("users");
    this.scheduledTasks = this.db.collection("scheduled_tasks");
  }

  async connect() {
    await this.client.connect();
  }

  // Package operations
  async getPackages(): Promise<Package[]> {
    const packages = await this.packages.find({}).toArray();
    return packages.map((p) => ({ ...p, _id: p._id?.toString() }));
  }

  async getPackage(id: string): Promise<Package | null> {
    const packageData = await this.packages.findOne({ id });
    return packageData
      ? { ...packageData, _id: packageData._id?.toString() }
      : null;
  }

  async createPackage(packageData: any): Promise<Package> {
    const newPackage: Package = {
      ...packageData,
      status: packageData.status || "Pending",
      source: packageData.source || "manual",
      timestamp: new Date().toISOString(),
    };

    const result = await this.packages.insertOne(newPackage);
    return { ...newPackage, _id: result.insertedId.toString() };
  }

  async updatePackage(
    id: string,
    updates: Partial<Package>
  ): Promise<Package | null> {
    const result = await this.packages.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result ? { ...result, _id: result._id?.toString() } : null;
  }

  async deletePackage(id: string): Promise<boolean> {
    const result = await this.packages.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async deleteAllPackages(): Promise<number> {
    const result = await this.packages.deleteMany({});
    return result.deletedCount || 0;
  }

  async deleteAssignmentsByPackageIds(packageIds: string[]): Promise<number> {
    const result = await this.assignments.deleteMany({
      packageId: { $in: packageIds },
    });
    return result.deletedCount || 0;
  }

  // Fleet operations
  async getFleet(): Promise<Fleet[]> {
    const fleet = await this.fleet.find({}).toArray();
    return fleet.map((f) => ({ ...f, _id: f._id?.toString() }));
  }

  async getFleetVehicle(id: string): Promise<Fleet | null> {
    const fleetData = await this.fleet.findOne({ id });
    return fleetData ? { ...fleetData, _id: fleetData._id?.toString() } : null;
  }

  async createFleetVehicle(fleetData: InsertFleet): Promise<Fleet> {
    const newFleet: Fleet = {
      ...fleetData,
      timestamp: new Date().toISOString(),
    };

    const result = await this.fleet.insertOne(newFleet);
    return { ...newFleet, _id: result.insertedId.toString() };
  }

  async updateFleetVehicle(
    id: string,
    updates: Partial<Fleet>
  ): Promise<Fleet | null> {
    const result = await this.fleet.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result ? { ...result, _id: result._id?.toString() } : null;
  }

  async deleteFleetVehicle(id: string): Promise<boolean> {
    const result = await this.fleet.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Assignment operations
  async getAssignments(): Promise<Assignment[]> {
    const assignments = await this.assignments.find({}).toArray();
    return assignments.map((a) => ({ ...a, _id: a._id?.toString() }));
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    const assignmentData = await this.assignments.findOne({ id });
    return assignmentData
      ? { ...assignmentData, _id: assignmentData._id?.toString() }
      : null;
  }

  async createAssignment(
    assignmentData: InsertAssignment
  ): Promise<Assignment> {
    const newAssignment: Assignment = {
      ...assignmentData,
      timestamp: new Date().toISOString(),
    };

    const result = await this.assignments.insertOne(newAssignment);
    return { ...newAssignment, _id: result.insertedId.toString() };
  }

  async updateAssignment(
    id: string,
    updates: Partial<Assignment>
  ): Promise<Assignment | null> {
    const result = await this.assignments.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result ? { ...result, _id: result._id?.toString() } : null;
  }

  async deleteAssignment(id: string): Promise<boolean> {
    const result = await this.assignments.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // User (Admin) operations
  async getAdminUser(username: string): Promise<AdminUser | null> {
    return await this.users.findOne({ username, role: "admin" });
  }

  async createAdminUser(user: AdminUser): Promise<AdminUser> {
    user.createdAt = new Date();
    user.role = "admin";
    const result = await this.users.insertOne(user);
    return { ...user, _id: result.insertedId.toString() };
  }

  async updateAdminUser(
    username: string,
    updates: Partial<AdminUser>
  ): Promise<AdminUser | null> {
    const result = await this.users.findOneAndUpdate(
      { username, role: "admin" },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result ? { ...result, _id: result._id?.toString() } : null;
  }

  // Scheduled Task operations
  async getScheduledTasks(): Promise<ScheduledTask[]> {
    return (await this.scheduledTasks.find({}).toArray()).map((t) => ({
      ...t,
      _id: t._id?.toString(),
    }));
  }

  async createScheduledTask(task: ScheduledTask): Promise<ScheduledTask> {
    const result = await this.scheduledTasks.insertOne(task);
    return { ...task, _id: result.insertedId.toString() };
  }

  async updateScheduledTask(
    id: string,
    updates: Partial<ScheduledTask>
  ): Promise<ScheduledTask | null> {
    const result = await this.scheduledTasks.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result ? { ...result, _id: result._id?.toString() } : null;
  }

  async deleteScheduledTask(id: string): Promise<boolean> {
    const result = await this.scheduledTasks.deleteOne({
      _id: new ObjectId(id),
    });
    return result.deletedCount > 0;
  }
}

export const storage = new MongoStorage();
