import {
  folders, knowledgeFiles, tasks, intelligencePosts, chatSessions, chatMessages, activityLogs,
  type Folder, type InsertFolder,
  type KnowledgeFile, type InsertKnowledgeFile,
  type Task, type InsertTask,
  type IntelligencePost, type InsertIntelligencePost,
  type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage,
  type ActivityLog, type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql, isNull } from "drizzle-orm";

export interface IStorage {
  getFolders(userId: string): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  renameFolder(id: number, userId: string, name: string): Promise<Folder | undefined>;
  moveFolder(id: number, userId: string, parentId: number | null): Promise<Folder | undefined>;
  deleteFolder(id: number, userId: string): Promise<void>;

  getKnowledgeFiles(userId: string): Promise<KnowledgeFile[]>;
  createKnowledgeFile(file: InsertKnowledgeFile): Promise<KnowledgeFile>;
  deleteKnowledgeFile(id: number, userId: string): Promise<void>;
  getKnowledgeFilesByUser(userId: string): Promise<KnowledgeFile[]>;
  moveFile(id: number, userId: string, folderId: number | null): Promise<KnowledgeFile | undefined>;

  getTasks(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, userId: string, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number, userId: string): Promise<void>;
  getCompletedTasksToday(userId: string): Promise<Task[]>;

  getIntelligencePosts(): Promise<IntelligencePost[]>;
  createIntelligencePost(post: InsertIntelligencePost): Promise<IntelligencePost>;

  getChatSessions(userId: string): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatMessages(sessionId: number, userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsToday(userId: string): Promise<ActivityLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getFolders(userId: string): Promise<Folder[]> {
    return db.select().from(folders).where(eq(folders.userId, userId)).orderBy(folders.sortOrder, folders.name);
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const [result] = await db.insert(folders).values(folder).returning();
    return result;
  }

  async renameFolder(id: number, userId: string, name: string): Promise<Folder | undefined> {
    const [result] = await db.update(folders).set({ name }).where(and(eq(folders.id, id), eq(folders.userId, userId))).returning();
    return result;
  }

  async moveFolder(id: number, userId: string, parentId: number | null): Promise<Folder | undefined> {
    let newLevel = 1;
    if (parentId) {
      const [parent] = await db.select().from(folders).where(and(eq(folders.id, parentId), eq(folders.userId, userId)));
      if (!parent) return undefined;
      newLevel = parent.level + 1;
      if (newLevel > 3) return undefined;
    }
    if (parentId === id) return undefined;
    const [result] = await db.update(folders).set({ parentId, level: newLevel }).where(and(eq(folders.id, id), eq(folders.userId, userId))).returning();
    return result;
  }

  async deleteFolder(id: number, userId: string): Promise<void> {
    const childFolders = await db.select().from(folders).where(and(eq(folders.parentId, id), eq(folders.userId, userId)));
    for (const child of childFolders) {
      await this.deleteFolder(child.id, userId);
    }
    await db.update(knowledgeFiles).set({ folderId: null }).where(and(eq(knowledgeFiles.folderId, id), eq(knowledgeFiles.userId, userId)));
    await db.delete(folders).where(and(eq(folders.id, id), eq(folders.userId, userId)));
  }

  async getKnowledgeFiles(userId: string): Promise<KnowledgeFile[]> {
    return db.select().from(knowledgeFiles).where(eq(knowledgeFiles.userId, userId)).orderBy(desc(knowledgeFiles.uploadedAt));
  }

  async createKnowledgeFile(file: InsertKnowledgeFile): Promise<KnowledgeFile> {
    const [result] = await db.insert(knowledgeFiles).values(file).returning();
    return result;
  }

  async deleteKnowledgeFile(id: number, userId: string): Promise<void> {
    await db.delete(knowledgeFiles).where(and(eq(knowledgeFiles.id, id), eq(knowledgeFiles.userId, userId)));
  }

  async getKnowledgeFilesByUser(userId: string): Promise<KnowledgeFile[]> {
    return db.select().from(knowledgeFiles).where(eq(knowledgeFiles.userId, userId));
  }

  async moveFile(id: number, userId: string, folderId: number | null): Promise<KnowledgeFile | undefined> {
    const [result] = await db.update(knowledgeFiles).set({ folderId }).where(and(eq(knowledgeFiles.id, id), eq(knowledgeFiles.userId, userId))).returning();
    return result;
  }

  async getTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [result] = await db.insert(tasks).values(task).returning();
    return result;
  }

  async updateTask(id: number, userId: string, data: Partial<Task>): Promise<Task | undefined> {
    const [result] = await db.update(tasks)
      .set(data)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return result;
  }

  async deleteTask(id: number, userId: string): Promise<void> {
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  async getCompletedTasksToday(userId: string): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return db.select().from(tasks).where(
      and(eq(tasks.userId, userId), eq(tasks.status, "done"), gte(tasks.completedAt, today))
    );
  }

  async getIntelligencePosts(): Promise<IntelligencePost[]> {
    return db.select().from(intelligencePosts).orderBy(desc(intelligencePosts.publishedAt));
  }

  async createIntelligencePost(post: InsertIntelligencePost): Promise<IntelligencePost> {
    const [result] = await db.insert(intelligencePosts).values(post).returning();
    return result;
  }

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    return db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.createdAt));
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [result] = await db.insert(chatSessions).values(session).returning();
    return result;
  }

  async getChatMessages(sessionId: number, userId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(
      and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId))
    ).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [result] = await db.insert(chatMessages).values(message).returning();
    return result;
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db.insert(activityLogs).values(log).returning();
    return result;
  }

  async getActivityLogsToday(userId: string): Promise<ActivityLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return db.select().from(activityLogs).where(
      and(eq(activityLogs.userId, userId), gte(activityLogs.createdAt, today))
    ).orderBy(desc(activityLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
