import { type Patient, type InsertPatient, type UpdatePatient, type User, type InsertUser, type UpsertUser, type DailyProgress, type InsertDailyProgress, type HandoverTasks, type InsertHandoverTasks, users, patients, dailyProgress, handoverTasks } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPatients(): Promise<Patient[]>;
  getArchivedPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, updates: UpdatePatient): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;
  restorePatient(id: string): Promise<boolean>;
  permanentlyDeletePatient(id: string): Promise<boolean>;
  cleanupExpiredPatients(): Promise<void>;
  // User operations for authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Daily progress operations
  getDailyProgress(patientId: string): Promise<DailyProgress[]>;
  createDailyProgress(progress: InsertDailyProgress): Promise<DailyProgress>;
  updateDailyProgress(id: string, updates: { notes: string }): Promise<DailyProgress | undefined>;
  deleteDailyProgress(id: string): Promise<boolean>;
  // Handover tasks operations
  getHandoverTasks(patientId: string, date?: string): Promise<HandoverTasks[]>;
  createHandoverTasks(handover: InsertHandoverTasks): Promise<HandoverTasks>;
  updateHandoverTasks(id: string, updates: { tasks?: string; status?: string }): Promise<HandoverTasks | undefined>;
  deleteHandoverTasks(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private patients: Map<string, Patient>;
  private users: Map<string, User>;
  private dailyProgressEntries: Map<string, DailyProgress>;
  private handoverTasksEntries: Map<string, HandoverTasks>;

  constructor() {
    this.patients = new Map();
    this.users = new Map();
    this.dailyProgressEntries = new Map();
    this.handoverTasksEntries = new Map();
    // Start cleanup interval for expired patients (run every hour)
    setInterval(() => this.cleanupExpiredPatients(), 60 * 60 * 1000);
  }

  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(patient => !patient.isDeleted);
  }

  async getArchivedPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(patient => patient.isDeleted);
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const now = new Date();
    const patient: Patient = {
      ...insertPatient,
      id,
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      medications: insertPatient.medications || null,
      historyOfPresentIllness: insertPatient.historyOfPresentIllness || null,
      notes: insertPatient.notes || null,
      tasks: insertPatient.tasks || null,
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: string, updates: UpdatePatient): Promise<Patient | undefined> {
    const existing = this.patients.get(id);
    if (!existing || existing.isDeleted) {
      return undefined;
    }

    const updated: Patient = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.patients.set(id, updated);
    return updated;
  }

  async deletePatient(id: string): Promise<boolean> {
    const existing = this.patients.get(id);
    if (!existing || existing.isDeleted) {
      return false;
    }

    const updated: Patient = {
      ...existing,
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    };
    this.patients.set(id, updated);
    return true;
  }

  async restorePatient(id: string): Promise<boolean> {
    const existing = this.patients.get(id);
    if (!existing || !existing.isDeleted) {
      return false;
    }

    const updated: Patient = {
      ...existing,
      isDeleted: false,
      deletedAt: null,
      updatedAt: new Date(),
    };
    this.patients.set(id, updated);
    return true;
  }

  async permanentlyDeletePatient(id: string): Promise<boolean> {
    return this.patients.delete(id);
  }

  async cleanupExpiredPatients(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const [id, patient] of Array.from(this.patients.entries())) {
      if (patient.isDeleted && patient.deletedAt && patient.deletedAt < sevenDaysAgo) {
        this.patients.delete(id);
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const now = new Date();
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = Array.from(this.users.values()).find(user => 
      user.email === userData.email
    );
    
    if (existingUser) {
      const now = new Date();
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: now,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
      };
      this.users.set(existingUser.id, updatedUser);
      return updatedUser;
    } else {
      return this.createUser(userData);
    }
  }

  async getDailyProgress(patientId: string): Promise<DailyProgress[]> {
    return Array.from(this.dailyProgressEntries.values())
      .filter(progress => progress.patientId === patientId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createDailyProgress(progressData: InsertDailyProgress): Promise<DailyProgress> {
    const id = randomUUID();
    const now = new Date();
    const progress: DailyProgress = {
      ...progressData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.dailyProgressEntries.set(id, progress);
    return progress;
  }

  async updateDailyProgress(id: string, updates: { notes: string }): Promise<DailyProgress | undefined> {
    const existing = this.dailyProgressEntries.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: DailyProgress = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.dailyProgressEntries.set(id, updated);
    return updated;
  }

  async deleteDailyProgress(id: string): Promise<boolean> {
    return this.dailyProgressEntries.delete(id);
  }

  // Handover tasks operations
  async getHandoverTasks(patientId: string, date?: string): Promise<HandoverTasks[]> {
    const allHandovers = Array.from(this.handoverTasksEntries.values());
    let filtered = allHandovers.filter(h => h.patientId === patientId);
    if (date) {
      filtered = filtered.filter(h => h.date === date);
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createHandoverTasks(insertHandover: InsertHandoverTasks): Promise<HandoverTasks> {
    const id = randomUUID();
    const now = new Date();
    const handover: HandoverTasks = {
      ...insertHandover,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.handoverTasksEntries.set(id, handover);
    return handover;
  }

  async updateHandoverTasks(id: string, updates: { tasks?: string; status?: string }): Promise<HandoverTasks | undefined> {
    const handover = this.handoverTasksEntries.get(id);
    if (!handover) return undefined;
    
    const updatedHandover = {
      ...handover,
      ...updates,
      updatedAt: new Date(),
    };
    this.handoverTasksEntries.set(id, updatedHandover);
    return updatedHandover;
  }

  async deleteHandoverTasks(id: string): Promise<boolean> {
    return this.handoverTasksEntries.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.isDeleted, false));
  }

  async getArchivedPatients(): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.isDeleted, true));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values(insertPatient)
      .returning();
    return patient;
  }

  async updatePatient(id: string, updates: UpdatePatient): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient || undefined;
  }

  async deletePatient(id: string): Promise<boolean> {
    const [patient] = await db
      .update(patients)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return !!patient;
  }

  async restorePatient(id: string): Promise<boolean> {
    const [patient] = await db
      .update(patients)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(patients.id, id))
      .returning();
    return !!patient;
  }

  async permanentlyDeletePatient(id: string): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id));
    return (result.rowCount || 0) > 0;
  }

  async cleanupExpiredPatients(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await db.delete(patients).where(
      eq(patients.isDeleted, true)
    );
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getDailyProgress(patientId: string): Promise<DailyProgress[]> {
    const progress = await db
      .select()
      .from(dailyProgress)
      .where(eq(dailyProgress.patientId, patientId))
      .orderBy(dailyProgress.date);
    return progress;
  }

  async createDailyProgress(progressData: InsertDailyProgress): Promise<DailyProgress> {
    const [progress] = await db
      .insert(dailyProgress)
      .values(progressData)
      .returning();
    return progress;
  }

  async updateDailyProgress(id: string, updates: { notes: string }): Promise<DailyProgress | undefined> {
    const [progress] = await db
      .update(dailyProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dailyProgress.id, id))
      .returning();
    return progress || undefined;
  }

  async deleteDailyProgress(id: string): Promise<boolean> {
    const result = await db
      .delete(dailyProgress)
      .where(eq(dailyProgress.id, id))
      .returning();
    return result.length > 0;
  }

  // Handover tasks operations
  async getHandoverTasks(patientId: string, date?: string): Promise<HandoverTasks[]> {
    let query = db.select().from(handoverTasks).where(eq(handoverTasks.patientId, patientId));
    const result = await query;
    
    let filtered = result;
    if (date) {
      filtered = result.filter(h => h.date === date);
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createHandoverTasks(insertHandover: InsertHandoverTasks): Promise<HandoverTasks> {
    const [result] = await db.insert(handoverTasks).values(insertHandover).returning();
    return result;
  }

  async updateHandoverTasks(id: string, updates: { tasks?: string; status?: string }): Promise<HandoverTasks | undefined> {
    const [result] = await db.update(handoverTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(handoverTasks.id, id))
      .returning();
    return result || undefined;
  }

  async deleteHandoverTasks(id: string): Promise<boolean> {
    const result = await db.delete(handoverTasks).where(eq(handoverTasks.id, id));
    return (result as any).rowCount > 0;
  }
}

export const storage = new MemStorage();
