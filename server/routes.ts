import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, updatePatientSchema, insertDailyProgressSchema, updateDailyProgressSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./simpleAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

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

  // Get daily progress for a patient (protected)
  app.get("/api/patients/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const progress = await storage.getDailyProgress(req.params.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching daily progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add daily progress for a patient (protected)
  app.post("/api/patients/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDailyProgressSchema.parse({
        ...req.body,
        patientId: req.params.id
      });
      const progress = await storage.createDailyProgress(validatedData);
      res.status(201).json(progress);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      console.error("Error creating daily progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update daily progress for a patient (protected)
  app.patch("/api/patients/:patientId/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updateDailyProgressSchema.parse(req.body);
      if (!validatedData.notes) {
        return res.status(400).json({ message: "Notes field is required" });
      }
      const progress = await storage.updateDailyProgress(req.params.id, { notes: validatedData.notes });
      if (!progress) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      res.json(progress);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      console.error("Error updating daily progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete daily progress entry for a patient (protected)
  app.delete("/api/patients/:patientId/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteDailyProgress(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      res.json({ message: "Progress entry deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting daily progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Handover tasks routes
  // Get handover tasks for a patient
  app.get("/api/patients/:id/handover", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { date } = req.query;
      const handoverTasks = await storage.getHandoverTasks(id, date as string);
      res.json(handoverTasks);
    } catch (error) {
      console.error("Error fetching handover tasks:", error);
      res.status(500).json({ error: "Failed to fetch handover tasks" });
    }
  });

  // Create or update handover tasks
  app.post("/api/patients/:id/handover", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { date, tasks, assignedShift } = req.body;
      
      // Check if handover already exists for this date
      const existingHandovers = await storage.getHandoverTasks(id, date);
      
      if (existingHandovers.length > 0) {
        // Update the latest handover for this date
        const latestHandover = existingHandovers[existingHandovers.length - 1];
        const updatedHandover = await storage.updateHandoverTasks(latestHandover.id, { tasks });
        res.json(updatedHandover);
      } else {
        // Create new handover
        const handoverData = { patientId: id, date, tasks, assignedShift };
        const handover = await storage.createHandoverTasks(handoverData);
        res.status(201).json(handover);
      }
    } catch (error) {
      console.error("Error creating/updating handover tasks:", error);
      res.status(500).json({ error: "Failed to create/update handover tasks" });
    }
  });

  // Update handover tasks
  app.patch("/api/patients/:id/handover/:handoverId", isAuthenticated, async (req, res) => {
    try {
      const { handoverId } = req.params;
      const handover = await storage.updateHandoverTasks(handoverId, req.body);
      if (handover) {
        res.json(handover);
      } else {
        res.status(404).json({ error: "Handover tasks not found" });
      }
    } catch (error) {
      console.error("Error updating handover tasks:", error);
      res.status(500).json({ error: "Failed to update handover tasks" });
    }
  });

  // Delete handover tasks
  app.delete("/api/patients/:id/handover/:handoverId", isAuthenticated, async (req, res) => {
    try {
      const { handoverId } = req.params;
      const success = await storage.deleteHandoverTasks(handoverId);
      if (success) {
        res.json({ message: "Handover tasks deleted" });
      } else {
        res.status(404).json({ error: "Handover tasks not found" });
      }
    } catch (error) {
      console.error("Error deleting handover tasks:", error);
      res.status(500).json({ error: "Failed to delete handover tasks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
