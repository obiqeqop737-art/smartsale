import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import * as mammoth from "mammoth";
import { generateIntelligence, getSchedulerStatus } from "./intelligence-scheduler";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userFolders = await storage.getFolders(userId);
      res.json(userFolders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, parentId } = req.body;
      let level = 1;
      if (parentId) {
        const parentFolders = await storage.getFolders(userId);
        const parent = parentFolders.find((f: any) => f.id === parentId);
        if (!parent) return res.status(404).json({ message: "Parent folder not found" });
        level = parent.level + 1;
        if (level > 3) return res.status(400).json({ message: "Maximum folder depth is 3 levels" });
      }
      const folder = await storage.createFolder({
        userId,
        name,
        parentId: parentId || null,
        level,
        sortOrder: 0,
      });
      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.patch("/api/folders/:id/rename", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { name } = req.body;
      const folder = await storage.renameFolder(id, userId, name);
      if (!folder) return res.status(404).json({ message: "Folder not found" });
      res.json(folder);
    } catch (error) {
      res.status(500).json({ message: "Failed to rename folder" });
    }
  });

  app.patch("/api/folders/:id/move", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { parentId } = req.body;
      const folder = await storage.moveFolder(id, userId, parentId);
      if (!folder) return res.status(404).json({ message: "Folder not found" });
      res.json(folder);
    } catch (error) {
      res.status(500).json({ message: "Failed to move folder" });
    }
  });

  app.delete("/api/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteFolder(id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  app.get("/api/knowledge-files", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getKnowledgeFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/knowledge-files/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      let content = "";
      const ext = file.originalname.split(".").pop()?.toLowerCase();

      if (ext === "txt") {
        content = file.buffer.toString("utf-8");
      } else if (ext === "pdf") {
        try {
          const pdfParse = (await import("pdf-parse")).default;
          if (typeof pdfParse === 'function') {
            const pdfData = await pdfParse(file.buffer);
            content = pdfData.text || "";
          } else {
             // Fallback if default is not a function
             const pdf = await import("pdf-parse");
             const pdfData = await (pdf as any)(file.buffer);
             content = pdfData.text || "";
          }
        } catch {
          content = `[PDF文件: ${file.originalname}] 文件已上传，大小: ${file.size} 字节。`;
        }
      } else if (ext === "docx") {
        try {
          const docResult = await mammoth.extractRawText({ buffer: file.buffer });
          content = docResult.value || "";
        } catch {
          content = `[DOCX文件: ${file.originalname}] 文件已上传，大小: ${file.size} 字节。`;
        }
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      if (!content || content.trim().length < 5) {
        content = `[文件: ${file.originalname}] 此文件已上传到知识库。文件大小: ${file.size} 字节。`;
      }

      const folderId = req.body?.folderId ? parseInt(req.body.folderId) : null;
      const knowledgeFile = await storage.createKnowledgeFile({
        userId,
        fileName: file.originalname,
        fileType: ext || "unknown",
        fileSize: file.size,
        content,
        folderId,
      });

      await storage.createActivityLog({
        userId,
        action: "upload_file",
        detail: `上传文件: ${file.originalname}`,
        module: "knowledge",
      });

      res.json(knowledgeFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.delete("/api/knowledge-files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteKnowledgeFile(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  app.get("/api/chat-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post("/api/chat-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title } = req.body;
      const session = await storage.createChatSession({ userId, title: title || "新对话" });
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get("/api/chat-sessions/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = parseInt(req.params.id);
      const messages = await storage.getChatMessages(sessionId, userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat-sessions/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = parseInt(req.params.id);
      const { content } = req.body;

      await storage.createChatMessage({ sessionId, userId, role: "user", content });

      const knowledgeBase = await storage.getKnowledgeFilesByUser(userId);
      const kbContext = knowledgeBase.map(f => `--- ${f.fileName} ---\n${f.content.substring(0, 3000)}`).join("\n\n");

      const history = await storage.getChatMessages(sessionId, userId);
      const chatHistory = history.slice(-10).map(m => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: m.content }],
      }));

      const systemPrompt = `你是一个专业的销售AI助手。你的任务是基于用户的个人知识库来回答问题。

以下是该用户知识库中的内容：
${kbContext || "（用户尚未上传任何文件到知识库）"}

请基于以上知识库内容来回答用户的问题。如果知识库中有相关信息，请优先引用知识库内容。如果没有相关信息，请如实告知并尽力提供帮助。回答要专业、简洁、有价值。`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "好的，我已准备好根据您的个人知识库为您提供专业的销售支持。请提出您的问题。" }] },
          ...chatHistory,
        ],
        config: { maxOutputTokens: 8192 },
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const text = chunk.text || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      await storage.createChatMessage({ sessionId, userId, role: "assistant", content: fullResponse });

      await storage.createActivityLog({
        userId,
        action: "chat",
        detail: `知识库问答: ${content.substring(0, 100)}`,
        module: "knowledge",
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "AI 回复出错" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to process message" });
      }
    }
  });

  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userTasks = await storage.getTasks(userId);
      res.json(userTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, priority, assignedBy, dueDate } = req.body;
      const task = await storage.createTask({
        userId,
        title,
        description: description || null,
        priority: priority || "medium",
        status: "todo",
        assignedBy: assignedBy || null,
        dueDate: dueDate || null,
      });
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const updates: any = { ...req.body };
      if (updates.status === "done") {
        updates.completedAt = new Date();
      }
      const task = await storage.updateTask(id, userId, updates);
      if (!task) return res.status(404).json({ message: "Task not found" });

      if (updates.status === "done") {
        await storage.createActivityLog({
          userId,
          action: "complete_task",
          detail: `完成任务: ${task.title}`,
          module: "tasks",
        });
      }

      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.patch("/api/knowledge-files/:id/move", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { folderId } = req.body;
      const file = await storage.moveFile(id, userId, folderId ?? null);
      if (!file) return res.status(404).json({ message: "File not found" });
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to move file" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteTask(id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.get("/api/intelligence-posts", isAuthenticated, async (req: any, res) => {
    try {
      const posts = await storage.getIntelligencePosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching intel:", error);
      res.status(500).json({ message: "Failed to fetch intelligence posts" });
    }
  });

  app.get("/api/intelligence-posts/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/intelligence-posts/:id/favorite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const isFavorite = await storage.toggleFavorite(userId, id);
      res.json({ isFavorite });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  app.post("/api/intelligence-posts/:id/view", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      await storage.createActivityLog({
        userId,
        action: "view_intelligence",
        detail: `浏览情报 #${postId}`,
        module: "intelligence",
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to log view" });
    }
  });

  app.get("/api/dashboard-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/daily-summaries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summaries = await storage.getDailySummaries(userId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching daily summaries:", error);
      res.status(500).json({ message: "Failed to fetch daily summaries" });
    }
  });

  app.post("/api/daily-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const completedTasks = await storage.getCompletedTasksToday(userId);
      const activityLogs = await storage.getActivityLogsToday(userId);
      const allTasks = await storage.getTasks(userId);

      const tasksInfo = completedTasks.length > 0
        ? completedTasks.map(t => `- ${t.title}${t.description ? `: ${t.description}` : ""}`).join("\n")
        : "今天暂无完成的任务";

      const pendingTasks = allTasks.filter(t => t.status !== "done");
      const pendingInfo = pendingTasks.length > 0
        ? pendingTasks.map(t => `- [${t.status === "in_progress" ? "进行中" : "待办"}] ${t.title}${t.dueDate ? ` (截止: ${t.dueDate})` : ""}`).join("\n")
        : "暂无待办任务";

      const activityInfo = activityLogs.length > 0
        ? activityLogs.map(a => `- [${a.module}] ${a.detail || a.action}`).join("\n")
        : "今天暂无活动记录";

      const prompt = `请生成一份结构化的销售日报。今天是${new Date().toLocaleDateString("zh-CN")}。

以下是今天的工作数据：

【已完成任务】
${tasksInfo}

【待办/进行中任务】
${pendingInfo}

【今日活动记录】
${activityInfo}

请按以下格式生成日报：
1. 今日工作总结（简要概括当天主要成果）
2. 已完成事项（列出完成的具体工作）
3. 进行中/待跟进事项（列出需要继续关注的工作）
4. 明日工作计划（基于待办事项给出建议）
5. 风险/需协调事项（如有截止日期临近的任务等）

请用专业但简洁的语言，适合向上级汇报。`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 8192 },
      });

      let fullSummary = "";
      for await (const chunk of stream) {
        const text = chunk.text || "";
        if (text) {
          fullSummary += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      if (fullSummary) {
        await storage.createDailySummary({
          userId,
          content: fullSummary,
          date: new Date().toISOString().slice(0, 10),
        });
      }

      await storage.createActivityLog({
        userId,
        action: "generate_summary",
        detail: "生成每日工作总结",
        module: "summary",
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error generating summary:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "生成日报失败" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to generate summary" });
      }
    }
  });

  app.post("/api/daily-summary/:id/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summaryId = parseInt(req.params.id);
      const user = await storage.getUserById(userId);
      if (!user?.superiorId) {
        return res.status(400).json({ message: "未设置上级领导，请先在个人中心设置" });
      }
      const result = await storage.sendDailySummary(summaryId, userId, user.superiorId);
      if (!result) {
        return res.status(404).json({ message: "日报不存在" });
      }
      await storage.createActivityLog({
        userId,
        action: "send_summary",
        detail: "发送日报给领导",
        module: "summary",
      });
      res.json(result);
    } catch (error) {
      console.error("Error sending summary:", error);
      res.status(500).json({ message: "发送日报失败" });
    }
  });

  app.delete("/api/daily-summary/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summaryId = parseInt(req.params.id);
      const deleted = await storage.deleteDailySummary(summaryId, userId);
      if (!deleted) {
        return res.status(400).json({ message: "无法删除：日报不存在或已发送给领导" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting summary:", error);
      res.status(500).json({ message: "删除日报失败" });
    }
  });

  app.get("/api/daily-summaries/received", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summaries = await storage.getReceivedSummaries(userId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching received summaries:", error);
      res.status(500).json({ message: "Failed to fetch received summaries" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUserById(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/me", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.claims.sub);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const deptUsers = user.departmentId ? 
        (await storage.getUsersByDepartmentId(user.departmentId)).filter(u => u.id !== user.id) : 
        [];
        
      res.json({
        ...user,
        departmentUsers: deptUsers
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/users/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, profileImageUrl, departmentId, superiorId } = req.body;
      const updateData: any = { firstName, profileImageUrl, superiorId };
      if (departmentId !== undefined) {
        updateData.departmentId = departmentId === null || departmentId === "" ? null : Number(departmentId);
      }
      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/users/me/avatar", isAuthenticated, upload.single("avatar"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });
      if (!file.mimetype.startsWith("image/")) return res.status(400).json({ message: "File must be an image" });
      if (file.size > 2 * 1024 * 1024) return res.status(400).json({ message: "Image must be under 2MB" });

      const base64 = file.buffer.toString("base64");
      const dataUrl = `data:${file.mimetype};base64,${base64}`;
      const user = await storage.updateUser(userId, { profileImageUrl: dataUrl });
      res.json(user);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  app.get("/api/admin/users/:id/assets", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUserById(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const userId = req.params.id;
      const counts = await storage.getUserAssetCounts(userId);
      res.json(counts);
    } catch (error) {
      console.error("Error fetching user assets:", error);
      res.status(500).json({ message: "Failed to fetch user assets" });
    }
  });

  app.post("/api/admin/handover", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUserById(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const operatorId = req.user.claims.sub;
      const { fromUserId, toUserId, note } = req.body;
      if (!fromUserId || typeof fromUserId !== "string" || !toUserId || typeof toUserId !== "string") {
        return res.status(400).json({ message: "Missing or invalid fromUserId or toUserId" });
      }
      if (note !== undefined && typeof note !== "string") {
        return res.status(400).json({ message: "Invalid note format" });
      }
      if (fromUserId === toUserId) return res.status(400).json({ message: "Cannot transfer to the same user" });

      const log = await storage.transferAssets(fromUserId, toUserId, operatorId, note);

      await storage.createActivityLog({
        userId: operatorId,
        action: "handover",
        detail: `资产交接: 从用户${fromUserId}转移至用户${toUserId}，包含${log.filesTransferred}份文件、${log.tasksTransferred}个任务`,
        module: "admin",
      });

      res.json(log);
    } catch (error) {
      console.error("Error performing handover:", error);
      res.status(500).json({ message: "Failed to perform handover" });
    }
  });

  app.get("/api/admin/handover-logs", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUserById(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const logs = await storage.getHandoverLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch handover logs" });
    }
  });

  // Department management (admin)
  app.get("/api/departments", isAuthenticated, async (_req: any, res) => {
    try {
      const depts = await storage.getDepartments();
      res.json(depts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/admin/departments", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUserById(req.user.claims.sub);
      if (currentUser?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
      const { name, parentId } = req.body;
      if (!name || typeof name !== "string") return res.status(400).json({ message: "Name is required" });
      const dept = await storage.createDepartment({ name, parentId: parentId || null });
      res.json(dept);
    } catch (error) {
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.patch("/api/admin/departments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUserById(req.user.claims.sub);
      if (currentUser?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
      const { name, parentId } = req.body;
      if (!name || typeof name !== "string") return res.status(400).json({ message: "Name is required" });
      const deptId = Number(req.params.id);
      if (parentId === deptId) return res.status(400).json({ message: "Cannot set self as parent" });
      const dept = await storage.updateDepartment(deptId, {
        name,
        parentId: parentId !== undefined ? (parentId || null) : undefined,
      });
      res.json(dept);
    } catch (error) {
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete("/api/admin/departments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUserById(req.user.claims.sub);
      if (currentUser?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
      await storage.deleteDepartment(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // Admin: update user type and department
  app.patch("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUserById(req.user.claims.sub);
      if (currentUser?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
      const { userType, departmentId } = req.body;
      const updateData: any = {};
      if (userType !== undefined) updateData.userType = userType;
      if (departmentId !== undefined) updateData.departmentId = departmentId === null ? null : Number(departmentId);
      const user = await storage.updateUser(req.params.id, updateData);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Task comments
  app.get("/api/tasks/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const comments = await storage.getTaskComments(Number(req.params.id));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content } = req.body;
      if (!content || typeof content !== "string") return res.status(400).json({ message: "Content is required" });
      const comment = await storage.createTaskComment({
        taskId: Number(req.params.id),
        userId,
        content,
      });
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Department head: get subordinate tasks
  app.get("/api/team-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUserById(userId);
      if (!currentUser || currentUser.userType !== "department_head") {
        return res.status(403).json({ message: "Only department heads can view team tasks" });
      }
      if (!currentUser.departmentId) {
        return res.json([]);
      }

      const allUsers = await storage.getAllUsers();
      const subordinateIds: string[] = [];

      // Direct subordinates in same department (regular users)
      const deptUsers = allUsers.filter(u => u.departmentId === currentUser.departmentId && u.id !== userId);
      for (const u of deptUsers) {
        if (u.userType === "user") {
          subordinateIds.push(u.id);
        }
      }

      // Sub-department heads who report to this user
      const subHeads = allUsers.filter(u => u.superiorId === userId && u.userType === "department_head" && u.id !== userId);
      for (const head of subHeads) {
        subordinateIds.push(head.id);
        // All regular users in the sub-head's department
        if (head.departmentId) {
          const subDeptUsers = allUsers.filter(u => u.departmentId === head.departmentId && u.userType === "user");
          for (const u of subDeptUsers) {
            if (!subordinateIds.includes(u.id)) subordinateIds.push(u.id);
          }
        }
      }

      const teamTasks = await storage.getTasksByUserIds(subordinateIds);
      const usersMap = Object.fromEntries(allUsers.map(u => [u.id, { id: u.id, firstName: u.firstName, email: u.email, profileImageUrl: u.profileImageUrl }]));

      res.json({
        tasks: teamTasks,
        users: usersMap,
        subordinateIds,
      });
    } catch (error) {
      console.error("Error fetching team tasks:", error);
      res.status(500).json({ message: "Failed to fetch team tasks" });
    }
  });

  app.get("/api/intelligence-scheduler/status", isAuthenticated, async (req: any, res) => {
    try {
      res.json(getSchedulerStatus());
    } catch (error) {
      res.status(500).json({ message: "Failed to get scheduler status" });
    }
  });

  app.post("/api/intelligence-scheduler/trigger", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUserById(userId);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const count = await generateIntelligence();
      res.json({ success: true, count, message: `成功生成 ${count} 条情报` });
    } catch (error: any) {
      console.error("Manual intelligence generation failed:", error);
      res.status(500).json({ message: "情报生成失败: " + (error.message || "未知错误") });
    }
  });

  return httpServer;
}
