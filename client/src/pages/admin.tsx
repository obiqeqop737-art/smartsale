import { useState, useMemo, useCallback } from "react";
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
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Building2,
  Plus,
  Edit3,
  Trash2,
  Crown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import type { User } from "@shared/models/auth";
import type { HandoverLog, Department } from "@shared/schema";

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

type AdminTab = "users" | "departments" | "handover";

export default function AdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [assetCounts, setAssetCounts] = useState<AssetCounts | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptParentId, setDeptParentId] = useState<string>("");
  const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);
  const [expandedDeptIds, setExpandedDeptIds] = useState<Set<number>>(new Set());

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });
  const { data: handoverLogs = [] } = useQuery<HandoverLog[]>({ queryKey: ["/api/admin/handover-logs"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

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

  const createDeptMutation = useMutation({
    mutationFn: async (data: { name: string; parentId: number | null }) => {
      const res = await apiRequest("POST", "/api/admin/departments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setDeptDialogOpen(false);
      setDeptName("");
      setDeptParentId("");
      toast({ title: "部门已创建" });
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, name, parentId }: { id: number; name: string; parentId: number | null }) => {
      const res = await apiRequest("PATCH", `/api/admin/departments/${id}`, { name, parentId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setDeptDialogOpen(false);
      setEditingDept(null);
      setDeptName("");
      setDeptParentId("");
      toast({ title: "部门已更新" });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setDeleteDeptId(null);
      toast({ title: "部门已删除" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; userType?: string; departmentId?: number | null }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "用户信息已更新" });
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
  const getDeptName = (deptId: number | null) => {
    if (!deptId) return "未分配";
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || "未知部门";
  };

  const tabs = [
    { key: "users" as AdminTab, label: "用户管理", icon: Users },
    { key: "departments" as AdminTab, label: "部门管理", icon: Building2 },
    { key: "handover" as AdminTab, label: "交接记录", icon: ArrowRightLeft },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-admin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-red-400" />
            </div>
            超级管理台
          </h1>
          <p className="mt-1 text-xs md:text-sm text-slate-400 dark:text-slate-500">用户管理 · 部门管理 · 资产交接中心</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="glass-card p-3 md:p-4 rounded-xl border border-blue-500/10">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-400 shrink-0" />
            <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300">总用户数</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-blue-500">{allUsers.length}</p>
        </div>
        <div className="glass-card p-3 md:p-4 rounded-xl border border-purple-500/10">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <Building2 className="h-4 w-4 md:h-5 md:w-5 text-purple-400 shrink-0" />
            <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300">部门数</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-purple-500">{departments.length}</p>
        </div>
        <div className="glass-card p-3 md:p-4 rounded-xl border border-red-500/10">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <ArrowRightLeft className="h-4 w-4 md:h-5 md:w-5 text-red-400 shrink-0" />
            <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300">交接记录</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-red-500">{handoverLogs.length}</p>
        </div>
        <div className="glass-card p-3 md:p-4 rounded-xl border border-emerald-500/10">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-400 shrink-0" />
            <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300">系统状态</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-emerald-500">运行正常</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-blue-500/10 pb-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.key
                ? "bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 border-b-transparent"
                : "text-slate-500 dark:text-slate-400 hover:text-blue-400 hover:bg-blue-500/5"
            }`}
            data-testid={`tab-${tab.key}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="glass-card rounded-xl overflow-hidden" data-testid="section-user-list">
          <div className="glass-dialog-header px-5 py-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-200">用户列表</span>
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
                  className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-4 hover:bg-blue-500/5 transition-colors"
                  data-testid={`user-row-${user.id}`}
                >
                  <Avatar className="h-10 w-10 border border-blue-500/20">
                    <AvatarImage src={user.profileImageUrl || ""} />
                    <AvatarFallback className="bg-blue-500/15 text-sm text-blue-300">
                      {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {getUserDisplayName(user)}
                      </p>
                      {user.userType === "department_head" && (
                        <Badge variant="outline" className="text-[10px] h-4 bg-amber-500/10 text-amber-400 border-amber-500/20 gap-0.5">
                          <Crown className="h-2.5 w-2.5" />
                          部门长
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {user.email || user.id} · {getDeptName(user.departmentId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                    <Select
                      value={user.departmentId?.toString() || "none"}
                      onValueChange={(v) => {
                        updateUserMutation.mutate({
                          id: user.id,
                          departmentId: v === "none" ? null : Number(v),
                        });
                      }}
                    >
                      <SelectTrigger className="glass-input h-8 w-full md:w-28 text-xs" data-testid={`select-dept-${user.id}`}>
                        <SelectValue placeholder="部门" />
                      </SelectTrigger>
                      <SelectContent className="glass-dialog border-blue-500/20">
                        <SelectItem value="none">未分配</SelectItem>
                        {departments.map(d => (
                          <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={user.userType || "user"}
                      onValueChange={(v) => {
                        updateUserMutation.mutate({ id: user.id, userType: v });
                      }}
                    >
                      <SelectTrigger className="glass-input h-8 w-full md:w-24 text-xs" data-testid={`select-type-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dialog border-blue-500/20">
                        <SelectItem value="user">普通用户</SelectItem>
                        <SelectItem value="department_head">部门长</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openHandover(user)}
                      className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 font-medium gap-1 h-8 text-xs"
                      data-testid={`button-handover-${user.id}`}
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      <span className="hidden sm:inline">交接</span>
                    </Button>
                  </div>
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
      )}

      {activeTab === "departments" && (() => {
        const getDescendantIds = (deptId: number): number[] => {
          const children = departments.filter(d => d.parentId === deptId);
          let ids: number[] = [];
          for (const child of children) {
            ids.push(child.id);
            ids = ids.concat(getDescendantIds(child.id));
          }
          return ids;
        };

        const getTreeCounts = (deptId: number) => {
          const allIds = [deptId, ...getDescendantIds(deptId)];
          const directMembers = allUsers.filter(u => u.departmentId === deptId).length;
          const directHeads = allUsers.filter(u => u.departmentId === deptId && u.userType === "department_head").length;
          const totalMembers = allUsers.filter(u => u.departmentId && allIds.includes(u.departmentId)).length;
          const totalHeads = allUsers.filter(u => u.departmentId && allIds.includes(u.departmentId) && u.userType === "department_head").length;
          const childCount = departments.filter(d => d.parentId === deptId).length;
          return { directMembers, directHeads, totalMembers, totalHeads, childCount };
        };

        const renderDeptNode = (dept: any, depth: number) => {
          const children = departments.filter(d => d.parentId === dept.id);
          const { directMembers, directHeads, totalMembers, totalHeads, childCount } = getTreeCounts(dept.id);
          const hasChildren = children.length > 0;
          const isExpanded = expandedDeptIds.has(dept.id);
          const hasSubMembers = totalMembers > directMembers;

          return (
            <div key={dept.id}>
              <div
                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-500/5 transition-colors group"
                style={{ paddingLeft: `${depth * 24 + 16}px` }}
                data-testid={`dept-row-${dept.id}`}
              >
                {hasChildren ? (
                  <button
                    onClick={() => setExpandedDeptIds(prev => {
                      const next = new Set(prev);
                      next.has(dept.id) ? next.delete(dept.id) : next.add(dept.id);
                      return next;
                    })}
                    className="p-0.5 text-blue-400/60 hover:text-blue-400 transition-colors shrink-0"
                  >
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                ) : (
                  <span className="w-[18px] shrink-0" />
                )}
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  depth === 0 ? "bg-purple-500/15 border border-purple-500/25" :
                  depth === 1 ? "bg-blue-500/10 border border-blue-500/20" :
                  "bg-slate-500/10 border border-slate-500/20"
                }`}>
                  <Building2 className={`h-4 w-4 ${
                    depth === 0 ? "text-purple-400" : depth === 1 ? "text-blue-400" : "text-slate-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{dept.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-blue-400">
                      {directMembers} 名直属成员
                    </span>
                    {hasSubMembers && (
                      <span className="text-[10px] text-cyan-400/80">
                        (含下级共 {totalMembers} 人)
                      </span>
                    )}
                    {directHeads > 0 && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                        <Crown className="h-2.5 w-2.5" />
                        {directHeads} 名部门长
                        {totalHeads > directHeads && <span className="text-amber-400/60">(含下级 {totalHeads})</span>}
                      </span>
                    )}
                    {!directHeads && totalHeads > 0 && (
                      <span className="text-[10px] text-amber-400/60 flex items-center gap-0.5">
                        <Crown className="h-2.5 w-2.5" />
                        下级共 {totalHeads} 名部门长
                      </span>
                    )}
                    {childCount > 0 && (
                      <span className="text-[10px] text-slate-500">{childCount} 个子部门</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                    onClick={() => {
                      setEditingDept(dept);
                      setDeptName(dept.name);
                      setDeptParentId(dept.parentId?.toString() || "");
                      setDeptDialogOpen(true);
                    }}
                    data-testid={`button-edit-dept-${dept.id}`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => setDeleteDeptId(dept.id)}
                    data-testid={`button-delete-dept-${dept.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {hasChildren && isExpanded && (
                <div className="relative">
                  <div
                    className="absolute w-px bg-gradient-to-b from-blue-500/20 to-transparent"
                    style={{ left: `${depth * 24 + 25}px`, top: 0, bottom: 0 }}
                  />
                  {children.map(child => renderDeptNode(child, depth + 1))}
                </div>
              )}
            </div>
          );
        };

        const rootDepts = departments.filter(d => !d.parentId);

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-400" />
                部门架构
              </h2>
              <Button
                onClick={() => {
                  setEditingDept(null);
                  setDeptName("");
                  setDeptParentId("");
                  setDeptDialogOpen(true);
                }}
                className="glow-btn text-white border-0"
                data-testid="button-add-department"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增部门
              </Button>
            </div>
            <div className="glass-card rounded-xl overflow-hidden">
              {departments.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">暂无部门，点击上方按钮新增</p>
                </div>
              ) : (
                <div className="py-1">
                  {rootDepts.map(dept => renderDeptNode(dept, 0))}
                  {departments.filter(d => d.parentId && !departments.some(p => p.id === d.parentId)).map(dept => renderDeptNode(dept, 0))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {activeTab === "handover" && handoverLogs.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden" data-testid="section-handover-logs">
          <div className="glass-dialog-header px-5 py-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">交接操作日志</span>
          </div>
          <ScrollArea className="max-h-[400px]">
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

      {activeTab === "handover" && handoverLogs.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <ArrowRightLeft className="h-10 w-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm text-slate-400 dark:text-slate-500">暂无交接记录</p>
        </div>
      )}

      <Dialog open={deptDialogOpen} onOpenChange={(open) => { if (!open) { setDeptDialogOpen(false); setEditingDept(null); } }}>
        <DialogContent className="glass-dialog border-blue-500/20 sm:max-w-md">
          <DialogHeader className="glass-dialog-header -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-200">
              <Building2 className="h-4 w-4 text-purple-400" />
              {editingDept ? "编辑部门" : "新增部门"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">部门名称</label>
              <Input
                placeholder="输入部门名称"
                value={deptName}
                onChange={e => setDeptName(e.target.value)}
                className="glass-input"
                data-testid="input-dept-name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">上级部门（可选）</label>
              <Select value={deptParentId || "none"} onValueChange={setDeptParentId}>
                <SelectTrigger className="glass-input" data-testid="select-dept-parent">
                  <SelectValue placeholder="无上级部门" />
                </SelectTrigger>
                <SelectContent className="glass-dialog border-blue-500/20">
                  <SelectItem value="none">无（顶级部门）</SelectItem>
                  {departments.filter(d => d.id !== editingDept?.id).map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setDeptDialogOpen(false); setEditingDept(null); }} className="text-slate-400 hover:text-slate-200">
                取消
              </Button>
              <Button
                onClick={() => {
                  const resolvedParentId = deptParentId && deptParentId !== "none" ? Number(deptParentId) : null;
                  if (editingDept) {
                    updateDeptMutation.mutate({ id: editingDept.id, name: deptName, parentId: resolvedParentId });
                  } else {
                    createDeptMutation.mutate({
                      name: deptName,
                      parentId: resolvedParentId,
                    });
                  }
                }}
                disabled={!deptName.trim() || createDeptMutation.isPending || updateDeptMutation.isPending}
                className="glow-btn text-white border-0"
                data-testid="button-submit-dept"
              >
                {editingDept ? "保存修改" : "创建部门"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDeptId !== null} onOpenChange={(open) => !open && setDeleteDeptId(null)}>
        <AlertDialogContent className="glass-dialog border-blue-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-700 dark:text-blue-200">确认删除部门</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              删除部门后，该部门下的子部门将变为独立部门。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-400 border-blue-500/15 hover:bg-blue-500/10">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDeptId && deleteDeptMutation.mutate(deleteDeptId)}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {drawerOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end" data-testid="handover-drawer">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-lg glass-dialog border-l border-blue-500/15 flex flex-col animate-in slide-in-from-right duration-300 max-h-[100dvh]">
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
                  <label className="text-xs font-medium text-blue-300 uppercase tracking-wider mb-3 block">待交接资产清单</label>
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
