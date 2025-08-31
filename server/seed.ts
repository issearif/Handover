import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Admin user already exists");
      return existingAdmin;
    }

    // Create admin user
    const hashedPassword = await hashPassword("admin123");
    const adminUser = await storage.createUser({
      username: "admin",
      password: hashedPassword,
      email: "admin@hospital.com",
      firstName: "Admin",
      lastName: "User",
    });

    console.log("Admin user created successfully:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Please change this password after first login");
    
    return adminUser;
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}