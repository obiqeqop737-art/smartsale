import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Send,
  Bot,
  User,
  Trash2,
  File,
  Loader2,
  Plus,
  MessageSquare,
} from "lucide-react";
import type { KnowledgeFile, ChatSession, ChatMessage } from "@shared/schema";

export default function KnowledgePage() {
  const { toast } = useToast();
  const [chatInput, setChatInput] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading: filesLoading } = useQuery<KnowledgeFile[]>({
    queryKey: ["/api/knowledge-files"],
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat-sessions"],
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat-sessions", activeSessionId, "messages"],
    enabled: !!activeSessionId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/knowledge-files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-files"] });
      toast({ title: "上传成功", description: "文件已添加到您的知识库" });
    },
    onError: (e: Error) => {
      toast({ title: "上传失败", description: e.message, variant: "destructive" });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/knowledge-files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-files"] });
      toast({ title: "已删除", description: "文件已从知识库中移除" });
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat-sessions", { title: "新对话" });
      return res.json();
    },
    onSuccess: (session: ChatSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions"] });
      setActiveSessionId(session.id);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "txt"].includes(ext || "")) {
        toast({ title: "格式不支持", description: "请上传 PDF、DOCX 或 TXT 文件", variant: "destructive" });
        return;
      }
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !activeSessionId || isStreaming) return;
    const content = chatInput.trim();
    setChatInput("");
    setIsStreaming(true);
    setStreamingContent("");

    queryClient.setQueryData<ChatMessage[]>(
      ["/api/chat-sessions", activeSessionId, "messages"],
      (old = []) => [...old, { id: Date.now(), sessionId: activeSessionId, userId: "", role: "user", content, createdAt: new Date() } as ChatMessage]
    );

    try {
      const res = await fetch(`/api/chat-sessions/${activeSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      toast({ title: "发送失败", description: "AI 回复出错，请重试", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions", activeSessionId, "messages"] });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-full gap-4 p-4" data-testid="page-knowledge">
      <div className="flex w-72 flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              知识库文件
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileUpload}
              data-testid="input-file-upload"
            />
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              data-testid="button-upload-file"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              上传文件
            </Button>
            <p className="text-xs text-muted-foreground">支持 PDF / DOCX / TXT</p>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">已上传文件</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {filesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <FileText className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">暂无文件</p>
                  <p className="text-xs">上传文件以构建知识库</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="group flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/50"
                      data-testid={`file-item-${f.id}`}
                    >
                      <File className="h-4 w-4 shrink-0 text-primary" />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm">{f.fileName}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(f.fileSize)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => deleteFileMutation.mutate(f.id)}
                        data-testid={`button-delete-file-${f.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
            <CardTitle className="text-base">对话列表</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => createSessionMutation.mutate()}
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {sessionsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <MessageSquare className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">暂无对话</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      className={`w-full rounded-md p-2 text-left text-sm transition-colors ${
                        activeSessionId === s.id ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveSessionId(s.id)}
                      data-testid={`chat-session-${s.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-1 flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" />
            AI 智能问答
            <Badge variant="secondary" className="text-xs">RAG</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden">
          {!activeSessionId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
              <Bot className="mb-4 h-16 w-16 opacity-20" />
              <h3 className="mb-2 text-lg font-medium">开始一个新对话</h3>
              <p className="mb-6 max-w-sm text-sm">
                基于您的个人知识库进行精准问答，涵盖历史报价、合同规范和客户记录
              </p>
              <Button
                onClick={() => createSessionMutation.mutate()}
                data-testid="button-start-chat"
              >
                <Plus className="mr-2 h-4 w-4" />
                新建对话
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 pb-4">
                  {msgsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                          <Skeleton className="h-16 w-3/4 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 && !streamingContent ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                      <Bot className="mb-3 h-10 w-10 opacity-30" />
                      <p className="text-sm">向 AI 提出您的问题</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            msg.role === "user" ? "bg-primary" : "bg-chart-2/20"
                          }`}>
                            {msg.role === "user" ? (
                              <User className="h-4 w-4 text-primary-foreground" />
                            ) : (
                              <Bot className="h-4 w-4 text-chart-2" />
                            )}
                          </div>
                          <div className={`max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        </div>
                      ))}
                      {streamingContent && (
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chart-2/20">
                            <Bot className="h-4 w-4 text-chart-2" />
                          </div>
                          <div className="max-w-[75%] rounded-lg bg-muted px-4 py-3 text-sm leading-relaxed">
                            <div className="whitespace-pre-wrap">{streamingContent}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="mt-3 flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="输入您的问题... (Enter 发送, Shift+Enter 换行)"
                  className="min-h-[44px] max-h-[120px] resize-none"
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || isStreaming}
                  data-testid="button-send-message"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
