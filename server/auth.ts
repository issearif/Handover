import express, { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// Simple in-memory session store for development
const activeSessions = new Map<string, string>(); // token -> userId

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken() {
  return randomBytes(32).toString('hex');
}

export function setupAuth(app: Express) {
  app.use(express.json());

  app.post("/api/register", async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      const token = generateToken();
      activeSessions.set(token, user.id);

      res.status(201).json({ 
        user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName },
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken();
      activeSessions.set(token, user.id);
      console.log("Login successful for user:", user.id, "token:", token);

      res.status(200).json({ 
        user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName },
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      activeSessions.delete(token);
    }
    res.sendStatus(200);
  });

  app.get("/api/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendStatus(401);
    }

    const token = authHeader.substring(7);
    const userId = activeSessions.get(token);
    
    if (!userId) {
      return res.sendStatus(401);
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        activeSessions.delete(token);
        return res.sendStatus(401);
      }

      res.json({ id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export async function isAuthenticated(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  console.log("Auth check - authorization header:", authHeader ? "exists" : "none");
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  const userId = activeSessions.get(token);
  console.log("Auth check - token valid:", !!userId);
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user) {
      activeSessions.delete(token);
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}