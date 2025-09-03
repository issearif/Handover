import express, { Express, RequestHandler } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";
import { authTokens } from "@shared/schema";
import { eq } from "drizzle-orm";

// Database-backed session storage for production reliability

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

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken();
      
      // Store token in database with 7-day expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await db.insert(authTokens).values({
        token,
        userId: user.id,
        expiresAt,
      });

      res.json({ 
        user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName },
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await db.delete(authTokens).where(eq(authTokens.token, token));
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      // Check token in database
      const [authToken] = await db.select().from(authTokens).where(eq(authTokens.token, token));
      if (!authToken || new Date() > authToken.expiresAt) {
        if (authToken) {
          // Clean up expired token
          await db.delete(authTokens).where(eq(authTokens.token, token));
        }
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      
      const userId = authToken.userId;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName 
      });
    } catch (error) {
      console.error("Auth user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Check token in database
    const [authToken] = await db.select().from(authTokens).where(eq(authTokens.token, token));
    if (!authToken || new Date() > authToken.expiresAt) {
      if (authToken) {
        // Clean up expired token
        await db.delete(authTokens).where(eq(authTokens.token, token));
      }
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await storage.getUser(authToken.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Add user to request object for use in routes
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};