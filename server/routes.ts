import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, updatePatientSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all active patients (protected)
  app.get("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get archived patients (protected)
  app.get("/api/patients/archived", isAuthenticated, async (req, res) => {
    try {
      const archivedPatients = await storage.getArchivedPatients();
      res.json(archivedPatients);
    } catch (error) {
      console.error("Error fetching archived patients:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get specific patient (protected)
  app.get("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new patient (protected)
  app.post("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update patient (protected)
  app.patch("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updatePatientSchema.parse(req.body);
      const patient = await storage.updatePatient(req.params.id, validatedData);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Soft delete patient (protected)
  app.delete("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deletePatient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json({ message: "Patient deleted successfully" });
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Restore patient from archive (protected)
  app.post("/api/patients/:id/restore", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.restorePatient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Patient not found or not archived" });
      }
      res.json({ message: "Patient restored successfully" });
    } catch (error) {
      console.error("Error restoring patient:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Permanently delete patient (protected)
  app.delete("/api/patients/:id/permanent", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.permanentlyDeletePatient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json({ message: "Patient permanently deleted" });
    } catch (error) {
      console.error("Error permanently deleting patient:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
