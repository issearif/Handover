import { type Patient, type InsertPatient, type UpdatePatient, type User, type UpsertUser, users, patients } from "@shared/schema";
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
  upsertUser(user: UpsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private patients: Map<string, Patient>;
  private users: Map<string, User>;

  constructor() {
    this.patients = new Map();
    this.users = new Map();
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

    for (const [id, patient] of this.patients.entries()) {
      if (patient.isDeleted && patient.deletedAt && patient.deletedAt < sevenDaysAgo) {
        this.patients.delete(id);
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: now,
      updatedAt: now,
      ...userData,
    };
    this.users.set(user.id, user);
    return user;
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
    return result.rowCount > 0;
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
}

export const storage = new DatabaseStorage();
