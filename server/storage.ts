import {
  departments, folders, knowledgeFiles, tasks, taskComments, intelligencePosts, chatSessions, chatMessages, activityLogs, dailySummaries, userFavorites, handoverLogs, notifications,
  type Department, type InsertDepartment,
  type Folder, type InsertFolder,
  type KnowledgeFile, type InsertKnowledgeFile,
  type Task, type InsertTask,
  type TaskComment, type InsertTaskComment,
  type IntelligencePost, type InsertIntelligencePost,
  type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage,
  type DailySummary, type InsertDailySummary,
  type ActivityLog, type InsertActivityLog,
  type UserFavorite, type InsertUserFavorite,
  type HandoverLog, type InsertHandoverLog,
  type Notification, type InsertNotification,
} from "@shared/schema";
import { users, type User } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql, isNull, count, ne, inArray } from "drizzle-orm";

export interface IStorage {
  getDepartments(): Promise<Department[]>;
  createDepartment(dept: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, data: { name: string; parentId?: number | null }): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<void>;

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
  getTasksByUserIds(userIds: string[]): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, userId: string, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number, userId: string): Promise<void>;
  getCompletedTasksToday(userId: string): Promise<Task[]>;

  getTaskComments(taskId: number): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;

  getIntelligencePosts(): Promise<IntelligencePost[]>;
  createIntelligencePost(post: InsertIntelligencePost): Promise<IntelligencePost>;
  toggleFavorite(userId: string, intelId: number): Promise<boolean>;
  getFavorites(userId: string): Promise<number[]>;

  getChatSessions(userId: string): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatMessages(sessionId: number, userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsToday(userId: string): Promise<ActivityLog[]>;

  getDailySummaries(userId: string): Promise<DailySummary[]>;
  createDailySummary(summary: InsertDailySummary): Promise<DailySummary>;
  getDashboardStats(userId: string): Promise<{
    fileCount: number;
    folderCount: number;
    taskTotal: number;
    taskDone: number;
    taskTodo: number;
    taskInProgress: number;
    intelCount: number;
    activityTodayCount: number;
    recentFiles: KnowledgeFile[];
    recentTasks: Task[];
    recentIntel: IntelligencePost[];
    recentActivity: ActivityLog[];
  }>;

  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getUsersByDepartmentId(departmentId: number): Promise<User[]>;
  getUserAssetCounts(userId: string): Promise<{ files: number; folders: number; tasks: number; chatSessions: number }>;
  transferAssets(fromUserId: string, toUserId: string, operatorId: string, note?: string): Promise<HandoverLog>;
  getHandoverLogs(): Promise<HandoverLog[]>;

  createNotification(data: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<(Notification & { fromUserName?: string })[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(id: number, userId: string): Promise<boolean>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getDepartments(): Promise<Department[]> {
    return db.select().from(departments).orderBy(departments.name);
  }

  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const [result] = await db.insert(departments).values(dept).returning();
    return result;
  }

  async updateDepartment(id: number, data: { name: string; parentId?: number | null }): Promise<Department | undefined> {
    const updateData: any = { name: data.name };
    if (data.parentId !== undefined) {
      updateData.parentId = data.parentId;
    }
    const [result] = await db.update(departments).set(updateData).where(eq(departments.id, id)).returning();
    return result;
  }

  async deleteDepartment(id: number): Promise<void> {
    await db.update(departments).set({ parentId: null }).where(eq(departments.parentId, id));
    await db.delete(departments).where(eq(departments.id, id));
  }

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

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async getTasksByUserIds(userIds: string[]): Promise<Task[]> {
    if (userIds.length === 0) return [];
    return db.select().from(tasks).where(inArray(tasks.userId, userIds)).orderBy(desc(tasks.createdAt));
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

  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(desc(taskComments.createdAt));
  }

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [result] = await db.insert(taskComments).values(comment).returning();
    return result;
  }

  async getIntelligencePosts(): Promise<IntelligencePost[]> {
    return db.select().from(intelligencePosts).orderBy(desc(intelligencePosts.publishedAt));
  }

  async createIntelligencePost(post: InsertIntelligencePost): Promise<IntelligencePost> {
    const [result] = await db.insert(intelligencePosts).values(post).returning();
    return result;
  }

  async toggleFavorite(userId: string, intelId: number): Promise<boolean> {
    const [existing] = await db.select().from(userFavorites).where(and(eq(userFavorites.userId, userId), eq(userFavorites.intelId, intelId)));
    if (existing) {
      await db.delete(userFavorites).where(eq(userFavorites.id, existing.id));
      return false;
    } else {
      await db.insert(userFavorites).values({ userId, intelId });
      return true;
    }
  }

  async getFavorites(userId: string): Promise<number[]> {
    const results = await db.select().from(userFavorites).where(eq(userFavorites.userId, userId));
    return results.map(r => r.intelId);
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

  async getDailySummaries(userId: string): Promise<DailySummary[]> {
    return db.select().from(dailySummaries).where(eq(dailySummaries.userId, userId)).orderBy(desc(dailySummaries.createdAt));
  }

  async createDailySummary(summary: InsertDailySummary): Promise<DailySummary> {
    const [result] = await db.insert(dailySummaries).values(summary).returning();
    return result;
  }

  async sendDailySummary(id: number, userId: string, sentToUserId: string): Promise<DailySummary | null> {
    const today = new Date().toISOString().slice(0, 10);
    await db.update(dailySummaries)
      .set({ status: "draft" })
      .where(and(
        eq(dailySummaries.userId, userId),
        eq(dailySummaries.date, today),
        eq(dailySummaries.status, "sent"),
      ));
    const [result] = await db.update(dailySummaries)
      .set({ status: "sent", sentToUserId, sentAt: new Date() })
      .where(and(eq(dailySummaries.id, id), eq(dailySummaries.userId, userId)))
      .returning();
    return result || null;
  }

  async getReceivedSummaries(userId: string): Promise<(DailySummary & { userName?: string; profileImageUrl?: string })[]> {
    const rows = await db.select({
      id: dailySummaries.id,
      userId: dailySummaries.userId,
      content: dailySummaries.content,
      date: dailySummaries.date,
      status: dailySummaries.status,
      sentToUserId: dailySummaries.sentToUserId,
      sentAt: dailySummaries.sentAt,
      createdAt: dailySummaries.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
    .from(dailySummaries)
    .leftJoin(users, eq(dailySummaries.userId, users.id))
    .where(and(
      eq(dailySummaries.sentToUserId, userId),
      eq(dailySummaries.status, "sent"),
    ))
    .orderBy(desc(dailySummaries.sentAt));
    return rows.map(r => ({
      id: r.id,
      userId: r.userId,
      content: r.content,
      date: r.date,
      status: r.status,
      sentToUserId: r.sentToUserId,
      sentAt: r.sentAt,
      createdAt: r.createdAt,
      userName: [r.firstName, r.lastName].filter(Boolean).join("") || undefined,
      profileImageUrl: r.profileImageUrl || undefined,
    }));
  }

  async deleteDailySummary(id: number, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(dailySummaries).where(
      and(eq(dailySummaries.id, id), eq(dailySummaries.userId, userId))
    );
    if (!existing || existing.status === "sent") return false;
    await db.delete(dailySummaries).where(eq(dailySummaries.id, id));
    return true;
  }

  async getDashboardStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userFiles = await db.select().from(knowledgeFiles).where(eq(knowledgeFiles.userId, userId));
    const userFolders = await db.select().from(folders).where(eq(folders.userId, userId));
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
    const allIntel = await db.select().from(intelligencePosts).orderBy(desc(intelligencePosts.publishedAt));
    const todayActivity = await db.select().from(activityLogs).where(
      and(eq(activityLogs.userId, userId), gte(activityLogs.createdAt, today))
    ).orderBy(desc(activityLogs.createdAt));

    return {
      fileCount: userFiles.length,
      folderCount: userFolders.length,
      taskTotal: userTasks.length,
      taskDone: userTasks.filter(t => t.status === "done").length,
      taskTodo: userTasks.filter(t => t.status === "todo").length,
      taskInProgress: userTasks.filter(t => t.status === "in_progress").length,
      intelCount: allIntel.length,
      activityTodayCount: todayActivity.length,
      recentFiles: userFiles.slice(0, 5),
      recentTasks: userTasks.filter(t => t.status !== "done").slice(0, 5),
      recentIntel: allIntel.slice(0, 4),
      recentActivity: todayActivity.slice(0, 8),
    };
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsersByDepartmentId(departmentId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.departmentId, departmentId));
  }

  async getUserAssetCounts(userId: string) {
    const userFiles = await db.select().from(knowledgeFiles).where(eq(knowledgeFiles.userId, userId));
    const userFolders = await db.select().from(folders).where(eq(folders.userId, userId));
    const pendingTasks = await db.select().from(tasks).where(and(eq(tasks.userId, userId), ne(tasks.status, "done")));
    const userSessions = await db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
    return {
      files: userFiles.length,
      folders: userFolders.length,
      tasks: pendingTasks.length,
      chatSessions: userSessions.length,
    };
  }

  async transferAssets(fromUserId: string, toUserId: string, operatorId: string, note?: string): Promise<HandoverLog> {
    const counts = await this.getUserAssetCounts(fromUserId);

    await db.update(knowledgeFiles).set({ userId: toUserId }).where(eq(knowledgeFiles.userId, fromUserId));
    await db.update(folders).set({ userId: toUserId }).where(eq(folders.userId, fromUserId));
    await db.update(tasks).set({ userId: toUserId }).where(and(eq(tasks.userId, fromUserId), ne(tasks.status, "done")));
    await db.update(chatSessions).set({ userId: toUserId }).where(eq(chatSessions.userId, fromUserId));
    await db.update(chatMessages).set({ userId: toUserId }).where(eq(chatMessages.userId, fromUserId));

    const [log] = await db.insert(handoverLogs).values({
      fromUserId,
      toUserId,
      operatorId,
      filesTransferred: counts.files,
      foldersTransferred: counts.folders,
      tasksTransferred: counts.tasks,
      chatSessionsTransferred: counts.chatSessions,
      note: note || null,
    }).returning();

    return log;
  }

  async getHandoverLogs(): Promise<HandoverLog[]> {
    return db.select().from(handoverLogs).orderBy(desc(handoverLogs.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async getNotifications(userId: string): Promise<(Notification & { fromUserName?: string })[]> {
    const rows = await db.select({
      id: notifications.id,
      userId: notifications.userId,
      type: notifications.type,
      title: notifications.title,
      content: notifications.content,
      relatedId: notifications.relatedId,
      relatedType: notifications.relatedType,
      fromUserId: notifications.fromUserId,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      fromFirstName: users.firstName,
      fromLastName: users.lastName,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.fromUserId, users.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

    return rows.map(r => ({
      id: r.id,
      userId: r.userId,
      type: r.type,
      title: r.title,
      content: r.content,
      relatedId: r.relatedId,
      relatedType: r.relatedType,
      fromUserId: r.fromUserId,
      isRead: r.isRead,
      createdAt: r.createdAt,
      fromUserName: [r.fromFirstName, r.fromLastName].filter(Boolean).join("") || undefined,
    }));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
    return result?.count || 0;
  }

  async markNotificationRead(id: number, userId: string): Promise<boolean> {
    const [updated] = await db.update(notifications).set({ isRead: 1 }).where(and(eq(notifications.id, id), eq(notifications.userId, userId))).returning();
    return !!updated;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: 1 }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
  }

  async deleteNotification(id: number, userId: string): Promise<boolean> {
    const [deleted] = await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId))).returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();
