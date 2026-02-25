import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Edit3,
  Check,
  X,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  BrainCircuit,
  Zap,
  Database,
} from "lucide-react";
import type { KnowledgeFile, ChatSession, ChatMessage, Folder as FolderType } from "@shared/schema";

function FolderTree({
  folders,
  files,
  selectedFolderId,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
}: {
  folders: FolderType[];
  files: KnowledgeFile[];
  selectedFolderId: number | null;
  onSelectFolder: (id: number | null) => void;
  onRenameFolder: (id: number, name: string) => void;
  onDeleteFolder: (id: number) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startRename = (f: FolderType) => {
    setRenamingId(f.id);
    setRenameValue(f.name);
  };

  const confirmRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameFolder(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const getChildren = (parentId: number | null) =>
    folders.filter((f) => f.parentId === parentId);

  const getFileCount = (folderId: number): number => {
    const directFiles = files.filter((f) => f.folderId === folderId).length;
    const childFolders = folders.filter((f) => f.parentId === folderId);
    return directFiles + childFolders.reduce((sum, cf) => sum + getFileCount(cf.id), 0);
  };

  const renderFolder = (folder: FolderType, depth: number) => {
    const children = getChildren(folder.id);
    const isExpanded = expandedIds.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isRenaming = renamingId === folder.id;
    const fileCount = getFileCount(folder.id);

    return (
      <div key={folder.id} data-testid={`folder-item-${folder.id}`}>
        <div
          className={`flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-all duration-200 group ${
            isSelected
              ? "bg-blue-500/15 border border-blue-500/30"
              : "hover:bg-blue-500/5 border border-transparent"
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            onSelectFolder(folder.id);
            if (children.length > 0) toggleExpand(folder.id);
          }}
        >
          {children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
              className="p-0.5 text-blue-400/60 hover:text-blue-400"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-400" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-400/70" />
          )}
          {isRenaming ? (
            <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-6 text-xs glass-input px-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
              />
              <button onClick={confirmRename} className="text-green-400 hover:text-green-300">
                <Check className="h-3 w-3" />
              </button>
              <button onClick={() => setRenamingId(null)} className="text-red-400 hover:text-red-300">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <span className="flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{folder.name}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-600">{fileCount}</span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(folder);
                  }}
                  className="p-0.5 text-slate-500 hover:text-blue-400"
                  data-testid={`button-rename-folder-${folder.id}`}
                >
                  <Edit3 className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  className="p-0.5 text-slate-500 hover:text-red-400"
                  data-testid={`button-delete-folder-${folder.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </>
          )}
        </div>
        {isExpanded && children.length > 0 && (
          <div className="folder-expand-enter relative">
            <div
              className="absolute w-px bg-gradient-to-b from-blue-500/30 to-transparent"
              style={{ left: `${depth * 16 + 20}px`, top: 0, bottom: 0 }}
            />
            {children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = getChildren(null);
  const unfolderedFiles = files.filter((f) => !f.folderId);

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelectFolder(null)}
        className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-all ${
          selectedFolderId === null
            ? "bg-blue-500/15 border border-blue-500/30 text-blue-300"
            : "text-slate-400 hover:bg-blue-500/5 border border-transparent"
        }`}
        data-testid="folder-root"
      >
        <Folder className="h-4 w-4 text-blue-400/70" />
        <span>所有文件</span>
        <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-600">{files.length}</span>
      </button>
      {rootFolders.map((folder) => renderFolder(folder, 0))}
    </div>
  );
}

export default function KnowledgePage() {
  const { toast } = useToast();
  const [chatInput, setChatInput] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string>("none");

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string>("none");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  const [deleteFileId, setDeleteFileId] = useState<number | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(window.innerWidth >= 768);

  const { data: folders = [] } = useQuery<FolderType[]>({
    queryKey: ["/api/folders"],
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<KnowledgeFile[]>({
    queryKey: ["/api/knowledge-files"],
  });

  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat-sessions"],
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat-sessions", activeSessionId, "messages"],
    enabled: !!activeSessionId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; parentId: number | null; level: number }) => {
      const res = await apiRequest("POST", "/api/folders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setFolderDialogOpen(false);
      setNewFolderName("");
      setNewFolderParentId("none");
      toast({ title: "文件夹已创建" });
    },
    onError: () => toast({ title: "创建失败", variant: "destructive" }),
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PATCH", `/api/folders/${id}/rename`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({ title: "重命名成功" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-files"] });
      if (selectedFolderId === deleteFolderId) setSelectedFolderId(null);
      setDeleteFolderId(null);
      toast({ title: "文件夹已删除" });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/knowledge-files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-files"] });
      setDeleteFileId(null);
      toast({ title: "文件已删除" });
    },
  });

  const handleBatchUpload = async () => {
    if (uploadFiles.length === 0) return;
    setIsUploading(true);
    const folderId = uploadTargetFolderId === "none" ? null : uploadTargetFolderId;

    for (const file of uploadFiles) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 10 }));
        const formData = new FormData();
        formData.append("file", file);
        if (folderId) formData.append("folderId", folderId);

        setUploadProgress((prev) => ({ ...prev, [file.name]: 40 }));
        const res = await fetch("/api/knowledge-files/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) throw new Error(await res.text());
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      } catch {
        setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }));
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/knowledge-files"] });
    setIsUploading(false);
    setTimeout(() => {
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadProgress({});
      setUploadTargetFolderId("none");
      toast({ title: "上传完成" });
    }, 800);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isStreaming) return;
    const content = chatInput.trim();
    setChatInput("");
    setIsStreaming(true);
    setStreamingContent("");

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const res = await apiRequest("POST", "/api/chat-sessions", {
          title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        });
        const session: ChatSession = await res.json();
        sessionId = session.id;
        setActiveSessionId(session.id);
        queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions"] });
      } catch {
        toast({ title: "创建对话失败", variant: "destructive" });
        setIsStreaming(false);
        return;
      }
    }

    queryClient.setQueryData<ChatMessage[]>(
      ["/api/chat-sessions", sessionId, "messages"],
      (old = []) => [
        ...old,
        { id: Date.now(), sessionId, userId: "", role: "user", content, createdAt: new Date() } as ChatMessage,
      ]
    );

    try {
      const res = await fetch(`/api/chat-sessions/${sessionId}/messages`, {
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
    } catch {
      toast({ title: "发送失败", description: "AI 回复出错，请重试", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions", sessionId, "messages"] });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const displayFiles = selectedFolderId
    ? files.filter((f) => f.folderId === selectedFolderId)
    : files;

  const getFolderLevel = (folderId: number | null): number => {
    if (!folderId) return 0;
    const f = folders.find((x) => x.id === folderId);
    if (!f) return 0;
    return f.level;
  };

  const getParentOptions = () => {
    const level1 = folders.filter((f) => f.level === 1);
    const level2 = folders.filter((f) => f.level === 2);
    return { level1, level2 };
  };

  const handleCreateFolder = () => {
    const parentId = newFolderParentId === "none" ? null : parseInt(newFolderParentId);
    const level = parentId ? getFolderLevel(parentId) + 1 : 1;
    if (level > 3) {
      toast({ title: "最多支持三级目录", variant: "destructive" });
      return;
    }
    createFolderMutation.mutate({ name: newFolderName, parentId, level });
  };

  return (
    <div className="flex h-full" data-testid="page-knowledge">
      {showPanel && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setShowPanel(false)}
        />
      )}
      <div className={`${showPanel ? "flex" : "hidden md:flex"} w-64 md:w-72 flex-col gap-3 p-3 border-r border-blue-500/10 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-30 max-md:w-64 max-md:bg-white max-md:dark:bg-slate-950 max-md:shadow-xl`}>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-blue-600/80 dark:text-blue-300/80 uppercase tracking-wider">目录导航</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10"
              onClick={() => setFolderDialogOpen(true)}
              data-testid="button-new-folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10"
              onClick={() => setUploadDialogOpen(true)}
              data-testid="button-upload-file"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10 md:hidden"
              onClick={() => setShowPanel(false)}
              data-testid="button-close-panel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <FolderTree
            folders={folders}
            files={files}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onRenameFolder={(id, name) => renameFolderMutation.mutate({ id, name })}
            onDeleteFolder={(id) => setDeleteFolderId(id)}
          />

          <div className="mt-3 border-t border-blue-500/10 pt-3">
            <span className="px-2 text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-wider">
              {selectedFolderId ? "当前目录文件" : "所有文件"} ({displayFiles.length})
            </span>
            <div className="mt-1 space-y-0.5">
              {displayFiles.map((f) => (
                <div
                  key={f.id}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-blue-500/5"
                  data-testid={`file-item-${f.id}`}
                >
                  <File className="h-3.5 w-3.5 shrink-0 text-blue-400/50" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-xs text-slate-600 dark:text-slate-300">{f.fileName}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-600">{formatFileSize(f.fileSize)}</p>
                  </div>
                  <button
                    className="p-0.5 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                    onClick={() => setDeleteFileId(f.id)}
                    data-testid={`button-delete-file-${f.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {displayFiles.length === 0 && (
                <div className="py-6 text-center text-slate-400 dark:text-slate-600">
                  <FileText className="mx-auto mb-1 h-6 w-6 opacity-30" />
                  <p className="text-xs">暂无文件</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="border-t border-blue-500/10 pt-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-wider">对话历史</span>
            {sessions.length > 0 && (
              <button
                onClick={() => setActiveSessionId(null)}
                className="text-[10px] text-blue-400/60 hover:text-blue-400 transition-colors"
                data-testid="button-new-chat"
              >
                新对话
              </button>
            )}
          </div>
          <ScrollArea className="max-h-[160px]">
            {sessions.length === 0 ? (
              <div className="py-4 text-center text-slate-400 dark:text-slate-600">
                <MessageSquare className="mx-auto mb-1 h-5 w-5 opacity-30" />
                <p className="text-[10px]">直接输入问题开始对话</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition-all ${
                      activeSessionId === s.id
                        ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                        : "text-slate-400 hover:bg-blue-500/5 border border-transparent"
                    }`}
                    onClick={() => setActiveSessionId(s.id)}
                    data-testid={`chat-session-${s.id}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <div className="flex flex-1 flex-col min-w-0 relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-blue-500/15 text-blue-400/70 hover:text-blue-400 shadow-sm md:hidden"
          data-testid="button-toggle-panel"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-auto px-3 md:px-6 py-4">
          <div className="max-w-3xl mx-auto space-y-4 pt-8 md:pt-0">
            {activeSessionId && msgsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                    <div className="h-16 w-3/4 rounded-lg glass-card animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (!activeSessionId || (messages.length === 0 && !streamingContent)) && !activeSessionId ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                <div className="relative mb-8">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center backdrop-blur-sm ai-hero-glow">
                    <BrainCircuit className="h-10 w-10 text-blue-400/80" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-blue-400 animate-pulse" />
                  </div>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-200 tracking-tight">
                  知识库 AI 助手
                </h3>
                <p className="mb-8 max-w-md text-center text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
                  基于您的文档知识库进行智能问答，涵盖历史报价、合同规范和客户记录
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 w-full max-w-lg">
                  {[
                    { icon: Database, label: "知识检索", desc: "精准匹配文档内容" },
                    { icon: Zap, label: "智能分析", desc: "深度理解业务语义" },
                    { icon: Sparkles, label: "AI 生成", desc: "结构化回答与建议" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="group glass-card rounded-xl p-3 border border-blue-500/10 hover:border-blue-500/25 transition-all duration-300 text-center cursor-default"
                    >
                      <div className="h-8 w-8 mx-auto mb-2 rounded-lg bg-blue-500/8 border border-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
                        <item.icon className="h-4 w-4 text-blue-400/70 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.label}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                        msg.role === "user"
                          ? "bg-blue-500 border-blue-400/30"
                          : "bg-blue-500/10 border-blue-500/20"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-lg px-3 md:px-4 py-2.5 md:py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "glow-btn text-white"
                          : "glass-card"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800/50 prose-code:text-blue-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {streamingContent && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                      <Bot className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="max-w-[75%] rounded-lg glass-card px-4 py-3 text-sm leading-relaxed">
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800/50 prose-code:text-blue-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-blue-500/10 p-3 md:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 rounded-xl glass-card border border-blue-500/15 hover:border-blue-500/30 transition-all duration-300 p-2 focus-within:border-blue-500/40 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.08)]">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={activeSessionId ? "继续提问... (Enter 发送)" : "输入问题，开始 AI 对话..."}
                className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                data-testid="input-chat-message"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || isStreaming}
                className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                data-testid="button-send-message"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400/60 dark:text-slate-600/60 mt-2">
              基于知识库文档的 RAG 智能问答 · 按 Enter 发送
            </p>
          </div>
        </div>
      </div>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="glass-dialog border-blue-500/20 sm:max-w-md">
          <DialogHeader className="glass-dialog-header -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-200">
              <FolderPlus className="h-4 w-4 text-blue-400" />
              新建文件夹
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">文件夹名称</label>
              <Input
                placeholder="输入文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="glass-input text-slate-200"
                data-testid="input-folder-name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">所属目录层级</label>
              <Select value={newFolderParentId} onValueChange={setNewFolderParentId}>
                <SelectTrigger className="glass-input text-slate-200" data-testid="select-folder-parent">
                  <SelectValue placeholder="选择父级目录" />
                </SelectTrigger>
                <SelectContent className="glass-dialog border-blue-500/20">
                  <SelectItem value="none">一级目录（根目录）</SelectItem>
                  {folders
                    .filter((f) => f.level === 1)
                    .map((f) => (
                      <SelectItem key={`l1-${f.id}`} value={String(f.id)}>
                        二级目录 → {f.name}
                      </SelectItem>
                    ))}
                  {folders
                    .filter((f) => f.level === 2)
                    .map((f) => (
                      <SelectItem key={`l2-${f.id}`} value={String(f.id)}>
                        三级目录 → {folders.find((p) => p.id === f.parentId)?.name} / {f.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setFolderDialogOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                取消
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                className="glow-btn text-white border-0"
                data-testid="button-confirm-create-folder"
              >
                {createFolderMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                确认创建
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="glass-dialog border-blue-500/20 sm:max-w-lg">
          <DialogHeader className="glass-dialog-header -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-200">
              <Upload className="h-4 w-4 text-blue-400" />
              上传文档
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">上传至目录</label>
              <Select value={uploadTargetFolderId} onValueChange={setUploadTargetFolderId}>
                <SelectTrigger className="glass-input text-slate-200" data-testid="select-upload-folder">
                  <SelectValue placeholder="选择目标文件夹" />
                </SelectTrigger>
                <SelectContent className="glass-dialog border-blue-500/20">
                  <SelectItem value="none">根目录</SelectItem>
                  {folders.map((f) => {
                    const path = f.parentId
                      ? `${folders.find((p) => p.id === f.parentId)?.name || ""} / ${f.name}`
                      : f.name;
                    return (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {"　".repeat(f.level - 1)}📁 {path}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div
              className="rounded-lg border-2 border-dashed border-blue-500/20 p-6 text-center cursor-pointer transition-all hover:border-blue-500/40 hover:bg-blue-500/5"
              onClick={() => fileInputRef.current?.click()}
              data-testid="upload-drop-zone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                multiple
                className="hidden"
                onChange={(e) => {
                  const fileList = Array.from(e.target.files || []);
                  setUploadFiles((prev) => [...prev, ...fileList]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                data-testid="input-file-upload"
              />
              <Upload className="mx-auto mb-2 h-8 w-8 text-blue-400/40" />
              <p className="text-sm text-slate-500 dark:text-slate-400">点击选择文件或拖拽至此</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">支持 PDF / DOCX / TXT，最大 10MB</p>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-auto">
                {uploadFiles.map((file, idx) => {
                  const progress = uploadProgress[file.name];
                  return (
                    <div key={idx} className="flex items-center gap-2 glass-card rounded-md p-2">
                      <File className="h-4 w-4 shrink-0 text-blue-400/50" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">{file.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-600">{formatFileSize(file.size)}</p>
                        {progress !== undefined && (
                          <div className="mt-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                progress === -1 ? "bg-red-500" : progress === 100 ? "bg-green-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${progress === -1 ? 100 : progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {!isUploading && (
                        <button
                          onClick={() => setUploadFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setUploadFiles([]);
                  setUploadProgress({});
                }}
                className="text-slate-400 hover:text-slate-200"
                disabled={isUploading}
              >
                取消
              </Button>
              <Button
                onClick={handleBatchUpload}
                disabled={uploadFiles.length === 0 || isUploading}
                className="glow-btn text-white border-0"
                data-testid="button-confirm-upload"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-3 w-3" />
                    开始上传 ({uploadFiles.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteFileId !== null} onOpenChange={(open) => !open && setDeleteFileId(null)}>
        <AlertDialogContent className="glass-dialog border-blue-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-700 dark:text-blue-200">确认删除文件</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              此操作将从知识库中永久删除该文件，且无法恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-400 border-blue-500/15 hover:bg-blue-500/10">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFileId && deleteFileMutation.mutate(deleteFileId)}
              className="bg-red-500/80 hover:bg-red-500 text-white"
              data-testid="button-confirm-delete-file"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteFolderId !== null} onOpenChange={(open) => !open && setDeleteFolderId(null)}>
        <AlertDialogContent className="glass-dialog border-blue-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-700 dark:text-blue-200">确认删除文件夹</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              删除文件夹将同时删除其下所有子文件夹。文件夹中的文件将移动到根目录。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-400 border-blue-500/15 hover:bg-blue-500/10">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFolderId && deleteFolderMutation.mutate(deleteFolderId)}
              className="bg-red-500/80 hover:bg-red-500 text-white"
              data-testid="button-confirm-delete-folder"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
