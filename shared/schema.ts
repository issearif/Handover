import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  mrn: text("mrn").notNull().unique(),
  age: text("age").notNull(),
  sex: text("sex").notNull(),
  bed: text("bed").notNull(),
  diagnosis: text("diagnosis").notNull(),
  doa: text("doa").notNull(), // Date of admission
  status: text("status").notNull(),
  medications: text("medications").default(""),
  tasks: text("tasks").default(""),
  notes: text("notes").default(""),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  age: z.string().min(1, "Age is required"),
  sex: z.enum(["M", "F", "O"], { required_error: "Sex is required" }),
  status: z.enum(["Stable", "Critical", "Monitoring", "Discharge"], { required_error: "Status is required" }),
});

export const updatePatientSchema = createInsertSchema(patients).omit({
  id: true,
  mrn: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type UpdatePatient = z.infer<typeof updatePatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
