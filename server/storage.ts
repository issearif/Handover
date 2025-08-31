import { type Patient, type InsertPatient, type UpdatePatient } from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private patients: Map<string, Patient>;

  constructor() {
    this.patients = new Map();
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
}

export const storage = new MemStorage();
