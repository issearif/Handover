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
  department: text("department").notNull(),
  bed: text("bed").notNull(),
  diagnosis: text("diagnosis").notNull(),
  doa: text("doa").notNull(), // Date of admission
  medications: text("medications").default(""),
  historyOfPresentIllness: text("history_of_present_illness").default(""),
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
  sex: z.enum(["M", "F"], { required_error: "Sex is required" }),
  department: z.enum(["MW", "PVT", "GW", "SW", "ER", "OPD"], { required_error: "Department is required" }),
});

export const updatePatientSchema = createInsertSchema(patients).omit({
  id: true,
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
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Auth tokens table for persistent session management
export const authTokens = pgTable("auth_tokens", {
  token: varchar("token").primaryKey(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = typeof authTokens.$inferInsert;

// Daily progress table for patient tracking
export const dailyProgress = pgTable("daily_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_daily_progress_patient_id").on(table.patientId),
  index("IDX_daily_progress_date").on(table.date),
]);

export const updateDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  patientId: true,
  date: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type DailyProgress = typeof dailyProgress.$inferSelect;

// Handover tasks table - for assigning tasks to next shift
export const handoverTasks = pgTable("handover_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format - date for which handover is being done
  tasks: text("tasks").notNull(), // Tasks to be completed by next shift
  status: text("status").default("pending"), // pending, completed
  assignedShift: text("assigned_shift").default("next"), // next, morning, evening, night
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_handover_tasks_patient_id").on(table.patientId),
  index("IDX_handover_tasks_date").on(table.date),
]);

export const insertHandoverTasksSchema = createInsertSchema(handoverTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateHandoverTasksSchema = createInsertSchema(handoverTasks).omit({
  id: true,
  patientId: true,
  date: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertHandoverTasks = z.infer<typeof insertHandoverTasksSchema>;
export type HandoverTasks = typeof handoverTasks.$inferSelect;
