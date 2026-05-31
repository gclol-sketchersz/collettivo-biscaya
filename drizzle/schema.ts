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
  budgetMin: int("budgetMin"),
  budgetMax: int("budgetMax"),
  budgetCurrency: varchar("budgetCurrency", { length: 10 }).default("EUR"),
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

/**
 * RSS Feeds configuration
 */
export const rssFeeds = mysqlTable("rss_feeds", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  feedUrl: varchar("feedUrl", { length: 500 }).notNull().unique(),
  source: varchar("source", { length: 100 }).notNull(),
  isActive: int("isActive").default(1).notNull(),
  lastImportedAt: timestamp("lastImportedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RssFeed = typeof rssFeeds.$inferSelect;
export type InsertRssFeed = typeof rssFeeds.$inferInsert;

/**
 * RSS imports tracking
 */
export const rssImports = mysqlTable("rss_imports", {
  id: int("id").autoincrement().primaryKey(),
  feedId: int("feedId").notNull().references(() => rssFeeds.id, { onDelete: "cascade" }),
  callId: int("callId").notNull().references(() => callsForEntries.id, { onDelete: "cascade" }),
  externalId: varchar("externalId", { length: 255 }).notNull(),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
});

export type RssImport = typeof rssImports.$inferSelect;
export type InsertRssImport = typeof rssImports.$inferInsert;

/**
 * Call views tracking
 */
export const callViews = mysqlTable("call_views", {
  id: int("id").autoincrement().primaryKey(),
  callId: int("callId").notNull().references(() => callsForEntries.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export type CallView = typeof callViews.$inferSelect;
export type InsertCallView = typeof callViews.$inferInsert;

/**
 * Call interactions (clicks, saves, etc.)
 */
export const callInteractions = mysqlTable("call_interactions", {
  id: int("id").autoincrement().primaryKey(),
  callId: int("callId").notNull().references(() => callsForEntries.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  interactionType: mysqlEnum("interactionType", ["view", "save", "external_link_click", "share"]).notNull(),
  interactedAt: timestamp("interactedAt").defaultNow().notNull(),
});

export type CallInteraction = typeof callInteractions.$inferSelect;
export type InsertCallInteraction = typeof callInteractions.$inferInsert;

/**
 * Chat history for Juana AI assistant
 */
export const chatHistory = mysqlTable("chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  rating: int("rating"), // 1-5 star rating for assistant messages
  feedback: text("feedback"), // Optional user feedback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;


/**
 * Verified entities for call validation
 * Whitelist of trusted organizations that issue cultural calls
 */
export const verifiedEntities = mysqlTable("verified_entities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  type: mysqlEnum("type", ["foundation", "institution", "government", "private", "nonprofit"]).notNull(),
  country: varchar("country", { length: 2 }).notNull(), // ISO 3166-1 alpha-2
  website: varchar("website", { length: 500 }),
  authorityScore: int("authorityScore").default(50).notNull(), // 0-100 score
  isVerified: int("isVerified").default(0).notNull(), // 0 = pending, 1 = verified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VerifiedEntity = typeof verifiedEntities.$inferSelect;
export type InsertVerifiedEntity = typeof verifiedEntities.$inferInsert;

/**
 * Import sources for calls
 * Tracks RSS feeds, APIs, and web scraping sources
 */
export const importSources = mysqlTable("import_sources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  type: mysqlEnum("type", ["rss", "api", "webscrape", "social_media"]).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  isActive: int("isActive").default(1).notNull(),
  lastImportedAt: timestamp("lastImportedAt"),
  nextImportAt: timestamp("nextImportAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImportSource = typeof importSources.$inferSelect;
export type InsertImportSource = typeof importSources.$inferInsert;

/**
 * Import logs for tracking bandi imports
 */
export const importLogs = mysqlTable("import_logs", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").references(() => importSources.id, { onDelete: "cascade" }),
  callId: int("callId").references(() => callsForEntries.id, { onDelete: "cascade" }),
  externalId: varchar("externalId", { length: 255 }), // ID from external source
  status: mysqlEnum("status", ["success", "duplicate", "filtered", "error"]).notNull(),
  reason: text("reason"), // Reason for filtering or error
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImportLog = typeof importLogs.$inferSelect;
export type InsertImportLog = typeof importLogs.$inferInsert;

/**
 * Entity scoring history for tracking authority changes
 */
export const entityScoringHistory = mysqlTable("entity_scoring_history", {
  id: int("id").autoincrement().primaryKey(),
  entityId: int("entityId").references(() => verifiedEntities.id, { onDelete: "cascade" }),
  previousScore: int("previousScore"),
  newScore: int("newScore").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EntityScoringHistory = typeof entityScoringHistory.$inferSelect;
export type InsertEntityScoringHistory = typeof entityScoringHistory.$inferInsert;
