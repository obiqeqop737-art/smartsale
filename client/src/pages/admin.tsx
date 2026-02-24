import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  ArrowRightLeft,
  FileText,
  FolderTree,
  KanbanSquare,
  MessageSquare,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@shared/models/auth";
import type { HandoverLog } from "@shared/schema";

interface AssetCounts {
  files: number;
  folders: number;
  tasks: number;
  chatSessions: number;
}

function getUserDisplayName(u: User) {
  if (u.firstName) return `${u.firstName} ${u.lastName || ""}`.trim();
  return u.email || u.id.slice(0, 8);
}

export default function AdminPage() {
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [assetCounts, setAssetCounts] = useState<AssetCounts | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });
  const { data: handoverLogs = [] } = useQuery<HandoverLog[]>({ queryKey: ["/api/admin/handover-logs"] });

  const handoverMutation = useMutation({
    mutationFn: async (data: { fromUserId: string; toUserId: string; note?: string }) => {
      const res = await apiRequest("POST", "/api/admin/handover", data);
      return res.json();
    },
    onSuccess: (log: HandoverLog) => {
      toast({
        title: "交接完成",
        description: `成功转移 ${log.filesTransferred} 份文件、${log.tasksTransferred} 个任务`,
      });
      setDrawerOpen(false);
      setSelectedUser(null);
      setTargetUserId("");
      setHandoverNote("");
      setAssetCounts(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/handover-logs"] });
    },
    onError: () => {
      toast({ title: "交接失败", description: "请稍后重试", variant: "destructive" });
    },
  });

  const openHandover = async (user: User) => {
    setSelectedUser(user);
    setTargetUserId("");
    setHandoverNote("");
    setAssetCounts(null);
    setDrawerOpen(true);
    setLoadingAssets(true);
    try {
      const res = await apiRequest("GET", `/api/admin/users/${user.id}/assets`);
      const counts = await res.json();
      setAssetCounts(counts);
    } catch {
      setAssetCounts({ files: 0, folders: 0, tasks: 0, chatSessions: 0 });
    } finally {
      setLoadingAssets(false);
    }
  };

  const confirmHandover = () => {
    if (!selectedUser || !targetUserId) return;
    handoverMutation.mutate({
      fromUserId: selectedUser.id,
      toUserId: targetUserId,
      note: handoverNote || undefined,
    });
  };

  const formatDate = (d: string | Date | null) => {
    if (!d) return "未知";
    return new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
  };

  const otherUsers = allUsers.filter((u) => u.id !== selectedUser?.id);

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-admin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            超级管理台
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">用户管理 · 资产交接中心</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden" data-testid="section-user-list">
        <div className="glass-dialog-header px-5 py-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-200">用户管理</span>
          <Badge variant="outline" className="ml-2 text-[10px] h-5 bg-blue-500/10 text-blue-400 border-blue-500/20">
            {allUsers.length} 位用户
          </Badge>
        </div>
        {usersLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-blue-500/5">
            {allUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-blue-500/5 transition-colors"
                data-testid={`user-row-${user.id}`}
              >
                <Avatar className="h-10 w-10 border border-blue-500/20">
                  <AvatarImage src={user.profileImageUrl || ""} />
                  <AvatarFallback className="bg-blue-500/15 text-sm text-blue-300">
                    {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email || user.id}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-600">
                    注册于 {formatDate(user.createdAt)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openHandover(user)}
                  className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 font-medium gap-1.5"
                  data-testid={`button-handover-${user.id}`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">离职/调岗交接</span>
                  <span className="sm:hidden">交接</span>
                </Button>
              </div>
            ))}
            {allUsers.length === 0 && (
              <div className="p-12 text-center">
                <UserIcon className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">暂无注册用户</p>
              </div>
            )}
          </div>
        )}
      </div>

      {handoverLogs.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden" data-testid="section-handover-logs">
          <div className="glass-dialog-header px-5 py-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">交接操作日志</span>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="divide-y divide-red-500/5">
              {handoverLogs.map((log) => {
                const fromUser = allUsers.find((u) => u.id === log.fromUserId);
                const toUser = allUsers.find((u) => u.id === log.toUserId);
                return (
                  <div
                    key={log.id}
                    className="px-5 py-3 flex items-start gap-3 bg-red-500/[0.02]"
                    data-testid={`handover-log-${log.id}`}
                  >
                    <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-red-300 font-medium">
                        {fromUser ? getUserDisplayName(fromUser) : log.fromUserId.slice(0, 8)}
                        <ChevronRight className="inline h-3 w-3 mx-1" />
                        {toUser ? getUserDisplayName(toUser) : log.toUserId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        转移 {log.filesTransferred} 份文件 · {log.foldersTransferred} 个文件夹 · {log.tasksTransferred} 个任务 · {log.chatSessionsTransferred} 个会话
                      </p>
                      {log.note && <p className="text-xs text-slate-500 mt-1 italic">备注: {log.note}</p>}
                      <p className="text-[10px] text-slate-600 mt-1">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end" data-testid="handover-drawer">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-lg glass-dialog border-l border-blue-500/15 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="glass-dialog-header px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                  <ArrowRightLeft className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">资产交接</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">离职/调岗一键交接</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
                className="h-8 w-8 text-slate-400 hover:text-slate-200"
                data-testid="button-close-drawer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-6 py-5">
              <div className="space-y-6">
                <div className="glass-card rounded-xl p-4 border border-red-500/10">
                  <label className="text-xs font-medium text-red-300 uppercase tracking-wider mb-3 block">流出方（离职人员）</label>
                  {selectedUser && (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-red-500/20">
                        <AvatarImage src={selectedUser.profileImageUrl || ""} />
                        <AvatarFallback className="bg-red-500/15 text-sm text-red-300">
                          {(selectedUser.firstName?.[0] || selectedUser.email?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-white">{getUserDisplayName(selectedUser)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{selectedUser.email || selectedUser.id}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-card rounded-xl p-4 border border-emerald-500/10">
                  <label className="text-xs font-medium text-emerald-300 uppercase tracking-wider mb-3 block">接收方（接手人员）</label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger className="glass-input" data-testid="select-target-user">
                      <SelectValue placeholder="选择接收人员..." />
                    </SelectTrigger>
                    <SelectContent className="glass-dialog border-blue-500/20">
                      {otherUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id} data-testid={`option-user-${u.id}`}>
                          <div className="flex items-center gap-2">
                            <span>{getUserDisplayName(u)}</span>
                            <span className="text-xs text-slate-500">({u.email || u.id.slice(0, 8)})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <label className="text-xs font-medium text-blue-300 uppercase tracking-wider mb-3 block">
                    待交接资产清单
                  </label>
                  {loadingAssets ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="h-6 w-6 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                    </div>
                  ) : assetCounts ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-lg font-bold text-slate-800 dark:text-white">{assetCounts.files}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">知识库文档</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
                        <FolderTree className="h-5 w-5 text-emerald-400" />
                        <div>
                          <p className="text-lg font-bold text-slate-800 dark:text-white">{assetCounts.folders}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">文件夹</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                        <KanbanSquare className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="text-lg font-bold text-slate-800 dark:text-white">{assetCounts.tasks}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">未完成任务</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-purple-500/5 border border-purple-500/10 p-3">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="text-lg font-bold text-slate-800 dark:text-white">{assetCounts.chatSessions}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">AI会话</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">备注（可选）</label>
                  <Textarea
                    value={handoverNote}
                    onChange={(e) => setHandoverNote(e.target.value)}
                    placeholder="如：因离职交接、调岗转移..."
                    className="glass-input resize-none h-20"
                    data-testid="input-handover-note"
                  />
                </div>

                <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300/80 leading-relaxed">
                    此操作将把流出方的所有知识库文件、文件夹、未完成任务和AI对话记录一键转移给接收方。操作不可撤销，请谨慎确认。
                  </p>
                </div>
              </div>
            </ScrollArea>

            <div className="shrink-0 border-t border-blue-500/10 px-6 py-4 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 border-slate-600 text-slate-400 hover:bg-slate-800/50"
                data-testid="button-cancel-handover"
              >
                取消
              </Button>
              <Button
                onClick={confirmHandover}
                disabled={!targetUserId || handoverMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 font-medium gap-2"
                data-testid="button-confirm-handover"
              >
                {handoverMutation.isPending ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                确认交接
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
