import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  KanbanSquare,
  Plus,
  AlertTriangle,
  GripVertical,
  Calendar,
  ArrowRight,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  ListTodo,
  Filter,
} from "lucide-react";
import type { Task } from "@shared/schema";

const columns = [
  { key: "todo", label: "待办", color: "text-slate-400", borderColor: "border-slate-500/20" },
  { key: "in_progress", label: "进行中", color: "text-blue-400", borderColor: "border-blue-500/20" },
  { key: "done", label: "已完成", color: "text-emerald-400", borderColor: "border-emerald-500/20" },
];

const priorityMap: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: "低", color: "text-slate-400", bgColor: "bg-slate-500/10 border-slate-500/20" },
  medium: { label: "中", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
  high: { label: "高", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
};

export default function TasksPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedBy: "",
    dueDate: "",
  });
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === "todo").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const done = tasks.filter(t => t.status === "done").length;
    return { total, todo, inProgress, done };
  }, [tasks]);

  const createTaskMutation = useMutation({
    mutationFn: async (data: typeof newTask) => {
      const res = await apiRequest("POST", "/api/tasks", {
        ...data,
        dueDate: data.dueDate || null,
        assignedBy: data.assignedBy || null,
        description: data.description || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setDialogOpen(false);
      setNewTask({ title: "", description: "", priority: "medium", assignedBy: "", dueDate: "" });
      toast({ title: "任务已创建" });
    },
    onError: (e: Error) => {
      toast({ title: "创建失败", description: e.message, variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditingTask(null);
      toast({ title: "任务已更新" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setDeleteTaskId(null);
      toast({ title: "任务已删除" });
    },
  });

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggingId !== null) {
      updateStatusMutation.mutate({ id: draggingId, status });
      setDraggingId(null);
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate: string | null) => {
    if (!dueDate) return false;
    const d = new Date(dueDate);
    const diff = d.getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const getTasksByStatus = (status: string) => {
    let filtered = tasks.filter((t) => t.status === status);
    if (priorityFilter) {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }
    return filtered;
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assignedBy: task.assignedBy || "",
      dueDate: task.dueDate || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;
    updateTaskMutation.mutate({
      id: editingTask.id,
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      assignedBy: newTask.assignedBy || null,
      dueDate: newTask.dueDate || null,
    });
  };

  return (
    <div className="flex h-full flex-col p-4 md:p-6" data-testid="page-tasks">
      <div className="mb-4 md:mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <KanbanSquare className="h-4 w-4 text-blue-400" />
            </div>
            任务看板
          </h1>
          <p className="mt-1 text-sm text-slate-500">管理销售任务和跟进计划</p>
        </div>
        <Button
          onClick={() => {
            setEditingTask(null);
            setNewTask({ title: "", description: "", priority: "medium", assignedBy: "", dueDate: "" });
            setDialogOpen(true);
          }}
          className="glow-btn text-white border-0"
          data-testid="button-create-task"
        >
          <Plus className="mr-2 h-4 w-4" />
          新建任务
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="task-stats">
        <div className="glass-card rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
            <KanbanSquare className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white" data-testid="text-stat-total">{taskStats.total}</p>
            <p className="text-[10px] text-slate-500">总任务</p>
          </div>
        </div>
        <div className="glass-card rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-500/10 border border-slate-500/15 flex items-center justify-center">
            <ListTodo className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white" data-testid="text-stat-todo">{taskStats.todo}</p>
            <p className="text-[10px] text-slate-500">待办</p>
          </div>
        </div>
        <div className="glass-card rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white" data-testid="text-stat-in-progress">{taskStats.inProgress}</p>
            <p className="text-[10px] text-slate-500">进行中</p>
          </div>
        </div>
        <div className="glass-card rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white" data-testid="text-stat-done">{taskStats.done}</p>
            <p className="text-[10px] text-slate-500">已完成</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2" data-testid="task-filters">
        <Filter className="h-3.5 w-3.5 text-slate-600" />
        <span className="text-xs text-slate-600 mr-1">优先级:</span>
        {[
          { key: null, label: "全部" },
          { key: "high", label: "高", color: "text-red-400" },
          { key: "medium", label: "中", color: "text-blue-400" },
          { key: "low", label: "低", color: "text-slate-400" },
        ].map((f) => (
          <button
            key={f.key ?? "all"}
            onClick={() => setPriorityFilter(f.key)}
            className={`rounded-full border px-2.5 py-1 text-[10px] transition-all ${
              priorityFilter === f.key
                ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:text-slate-300"
            }`}
            data-testid={`filter-priority-${f.key ?? "all"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map((col) => (
            <div key={col.key} className="space-y-3">
              <div className="h-8 rounded-lg glass-card animate-pulse" />
              {[1, 2].map((i) => <div key={i} className="h-32 rounded-xl glass-card animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
          {columns.map((col) => {
            const colTasks = getTasksByStatus(col.key);
            const isDropTarget = dragOverColumn === col.key;
            return (
              <div
                key={col.key}
                className={`flex flex-col rounded-xl p-3 transition-all duration-300 min-w-[260px] md:min-w-0 ${
                  isDropTarget ? "drop-zone-active" : "glass-card"
                }`}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.key)}
                data-testid={`column-${col.key}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${col.key === "todo" ? "bg-slate-400" : col.key === "in_progress" ? "bg-blue-400 animate-glow-pulse" : "bg-emerald-400"}`} />
                    <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                  </div>
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 text-[10px] text-blue-300/70">
                    {colTasks.length}
                  </span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-1">
                    {colTasks.map((task) => {
                      const prio = priorityMap[task.priority] || priorityMap.medium;
                      const overdue = task.status !== "done" && isOverdue(task.dueDate);
                      const dueSoon = task.status !== "done" && isDueSoon(task.dueDate);
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`glass-card glass-card-hover rounded-lg p-3 cursor-grab transition-all duration-200 active:cursor-grabbing group ${
                            draggingId === task.id ? "opacity-40" : ""
                          }`}
                          data-testid={`task-card-${task.id}`}
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <GripVertical className="mt-0.5 h-3 w-3 shrink-0 text-slate-700 group-hover:text-blue-400/40" />
                            <h4 className="flex-1 text-sm font-medium leading-snug text-white">{task.title}</h4>
                            <div className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] ${prio.bgColor} ${prio.color}`}>
                              {prio.label}
                            </div>
                          </div>
                          {task.description && (
                            <p className="mb-2 text-xs leading-relaxed text-slate-500 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 text-[10px] ${
                                overdue ? "text-red-400" : dueSoon ? "text-yellow-400" : "text-slate-600"
                              }`}>
                                {overdue ? <AlertTriangle className="h-2.5 w-2.5" /> : <Calendar className="h-2.5 w-2.5" />}
                                {new Date(task.dueDate).toLocaleDateString("zh-CN")}
                              </span>
                            )}
                            {task.assignedBy && (
                              <span className="text-[10px] text-slate-600">指派: {task.assignedBy}</span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditDialog(task)}
                                className="p-1 text-slate-500 hover:text-blue-400 rounded"
                                data-testid={`button-edit-task-${task.id}`}
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setDeleteTaskId(task.id)}
                                className="p-1 text-slate-500 hover:text-red-400 rounded"
                                data-testid={`button-delete-task-${task.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            {task.status !== "done" && (
                              <div className="flex gap-1">
                                {col.key === "todo" && (
                                  <button
                                    className="flex items-center gap-0.5 rounded-md bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 text-[10px] text-blue-400 hover:bg-blue-500/20 transition-all"
                                    onClick={() => updateStatusMutation.mutate({ id: task.id, status: "in_progress" })}
                                  >
                                    开始 <ArrowRight className="h-2.5 w-2.5" />
                                  </button>
                                )}
                                {col.key === "in_progress" && (
                                  <button
                                    className="flex items-center gap-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                    onClick={() => updateStatusMutation.mutate({ id: task.id, status: "done" })}
                                  >
                                    完成 <ArrowRight className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <KanbanSquare className="mb-2 h-8 w-8 text-blue-500/10" />
                        <p className="text-xs text-slate-600">暂无任务</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen || editingTask !== null} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingTask(null); } }}>
        <DialogContent className="glass-dialog border-blue-500/20 sm:max-w-md">
          <DialogHeader className="glass-dialog-header -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2 text-blue-200">
              <KanbanSquare className="h-4 w-4 text-blue-400" />
              {editingTask ? "编辑任务" : "新建任务"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">任务标题</label>
              <Input
                placeholder="任务标题"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="glass-input text-slate-200"
                data-testid="input-task-title"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">任务描述</label>
              <Textarea
                placeholder="任务描述 (可选)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="glass-input text-slate-200"
                data-testid="input-task-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">优先级</label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger className="glass-input text-slate-200" data-testid="select-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dialog border-blue-500/20">
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">截止日期</label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="glass-input text-slate-200"
                  data-testid="input-task-due-date"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">指派人</label>
              <Input
                placeholder="指派人 (可选)"
                value={newTask.assignedBy}
                onChange={(e) => setNewTask({ ...newTask, assignedBy: e.target.value })}
                className="glass-input text-slate-200"
                data-testid="input-task-assigned-by"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => { setDialogOpen(false); setEditingTask(null); }}
                className="text-slate-400 hover:text-slate-200"
              >
                取消
              </Button>
              <Button
                onClick={editingTask ? handleSaveEdit : () => createTaskMutation.mutate(newTask)}
                disabled={!newTask.title.trim() || createTaskMutation.isPending || updateTaskMutation.isPending}
                className="glow-btn text-white border-0"
                data-testid="button-submit-task"
              >
                {(createTaskMutation.isPending || updateTaskMutation.isPending) && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {editingTask ? "保存修改" : "创建任务"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTaskId !== null} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent className="glass-dialog border-blue-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-200">确认删除任务</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">此操作将永久删除该任务，且无法恢复。确定要继续吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-400 border-blue-500/15 hover:bg-blue-500/10">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskId && deleteTaskMutation.mutate(deleteTaskId)}
              className="bg-red-500/80 hover:bg-red-500 text-white"
              data-testid="button-confirm-delete-task"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
