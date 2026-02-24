import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  level: integer("level").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const knowledgeFiles = pgTable("knowledge_files", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  folderId: integer("folder_id"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  content: text("content").notNull(),
  uploadedAt: timestamp("uploaded_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  assignedBy: text("assigned_by"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const intelligencePosts = pgTable("intelligence_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  category: text("category").notNull(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  summary: text("summary").notNull(),
  aiInsight: text("ai_insight"),
  tags: text("tags").array(),
  publishedAt: timestamp("published_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull().default("新对话"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const dailySummaries = pgTable("daily_summaries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(),
  detail: text("detail"),
  module: text("module").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertFolderSchema = createInsertSchema(folders).omit({ id: true, createdAt: true });
export const insertKnowledgeFileSchema = createInsertSchema(knowledgeFiles).omit({ id: true, uploadedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, completedAt: true });
export const insertIntelligencePostSchema = createInsertSchema(intelligencePosts).omit({ id: true, createdAt: true });
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertDailySummarySchema = createInsertSchema(dailySummaries).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type KnowledgeFile = typeof knowledgeFiles.$inferSelect;
export type InsertKnowledgeFile = z.infer<typeof insertKnowledgeFileSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type IntelligencePost = typeof intelligencePosts.$inferSelect;
export type InsertIntelligencePost = z.infer<typeof insertIntelligencePostSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type DailySummary = typeof dailySummaries.$inferSelect;
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
