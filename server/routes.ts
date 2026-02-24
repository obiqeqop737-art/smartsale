import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import * as mammoth from "mammoth";

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
          const pdfData = await pdfParse(file.buffer);
          content = pdfData.text || "";
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

      for await (const chunk of stream) {
        const text = chunk.text || "";
        if (text) {
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
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

  return httpServer;
}
