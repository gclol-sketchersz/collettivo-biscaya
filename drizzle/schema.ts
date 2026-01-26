import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscription levels: Base (regional), Premium (national), Pro (european)
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  level: mysqlEnum("level", ["base", "premium", "pro"]).default("base").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Call for entries (bandi culturali)
 * Geographic levels: regional, national, european
 */
export const callsForEntries = mysqlTable("calls_for_entries", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  entity: varchar("entity", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  geographicLevel: mysqlEnum("geographicLevel", ["regional", "national", "european"]).notNull(),
  callType: mysqlEnum("callType", ["exhibition", "residency", "competition", "grant", "award", "fellowship", "curatorial_open_call"]).notNull(),
  deadline: timestamp("deadline").notNull(),
  requirements: text("requirements"),
  benefits: text("benefits"),
  externalLink: varchar("externalLink", { length: 500 }),
  costs: varchar("costs", { length: 255 }),
  qualitativeNotes: text("qualitativeNotes"),
  accessibility: text("accessibility"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CallForEntry = typeof callsForEntries.$inferSelect;
export type InsertCallForEntry = typeof callsForEntries.$inferInsert;

/**
 * Saved/favorited calls by users
 */
export const savedCalls = mysqlTable("saved_calls", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  callId: int("callId").notNull().references(() => callsForEntries.id, { onDelete: "cascade" }),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type SavedCall = typeof savedCalls.$inferSelect;
export type InsertSavedCall = typeof savedCalls.$inferInsert;

/**
 * Notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  callId: int("callId").references(() => callsForEntries.id, { onDelete: "set null" }),
  type: mysqlEnum("type", ["new_call", "deadline_reminder", "subscription_update"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Email preferences for users
 */
export const emailPreferences = mysqlTable("email_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  newCallsNotification: int("newCallsNotification").default(1).notNull(),
  deadlineReminderNotification: int("deadlineReminderNotification").default(1).notNull(),
  deadlineReminderDays: int("deadlineReminderDays").default(7).notNull(),
  notificationFrequency: varchar("notificationFrequency", { length: 20 }).default("daily").notNull(),
  lastEmailSent: timestamp("lastEmailSent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailPreferences = typeof emailPreferences.$inferSelect;
export type InsertEmailPreferences = typeof emailPreferences.$inferInsert;