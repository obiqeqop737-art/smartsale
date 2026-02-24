import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Clock,
  AlertTriangle,
  GripVertical,
  Calendar,
  ArrowRight,
} from "lucide-react";
import type { Task } from "@shared/schema";

const columns = [
  { key: "todo", label: "待办", color: "text-muted-foreground" },
  { key: "in_progress", label: "进行中", color: "text-chart-2" },
  { key: "done", label: "已完成", color: "text-chart-4" },
];

const priorityMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  low: { label: "低", variant: "secondary" },
  medium: { label: "中", variant: "default" },
  high: { label: "高", variant: "destructive" },
};

export default function TasksPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedBy: "",
    dueDate: "",
  });
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
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
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex h-full flex-col p-4" data-testid="page-tasks">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <KanbanSquare className="h-5 w-5 text-primary" />
            任务看板
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">管理销售任务和跟进计划</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-task">
              <Plus className="mr-2 h-4 w-4" />
              新建任务
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建任务</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="任务标题"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                data-testid="input-task-title"
              />
              <Textarea
                placeholder="任务描述 (可选)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                data-testid="input-task-description"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">优先级</label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
                  >
                    <SelectTrigger data-testid="select-task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">截止日期</label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    data-testid="input-task-due-date"
                  />
                </div>
              </div>
              <Input
                placeholder="指派人 (可选)"
                value={newTask.assignedBy}
                onChange={(e) => setNewTask({ ...newTask, assignedBy: e.target.value })}
                data-testid="input-task-assigned-by"
              />
              <Button
                className="w-full"
                onClick={() => createTaskMutation.mutate(newTask)}
                disabled={!newTask.title.trim() || createTaskMutation.isPending}
                data-testid="button-submit-task"
              >
                创建任务
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid flex-1 grid-cols-3 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="space-y-3">
              <Skeleton className="h-8 w-full" />
              {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-3 gap-4">
          {columns.map((col) => {
            const colTasks = getTasksByStatus(col.key);
            return (
              <div
                key={col.key}
                className="flex flex-col rounded-lg bg-muted/30 p-3"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.key)}
                data-testid={`column-${col.key}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {colTasks.length}
                    </Badge>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-2">
                    {colTasks.map((task) => {
                      const prio = priorityMap[task.priority] || priorityMap.medium;
                      const overdue = task.status !== "done" && isOverdue(task.dueDate);
                      const dueSoon = task.status !== "done" && isDueSoon(task.dueDate);
                      return (
                        <Card
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`cursor-grab transition-all duration-150 active:cursor-grabbing ${
                            draggingId === task.id ? "opacity-50" : ""
                          }`}
                          data-testid={`task-card-${task.id}`}
                        >
                          <CardContent className="p-3">
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <GripVertical className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50" />
                              <h4 className="flex-1 text-sm font-medium leading-snug">{task.title}</h4>
                              <Badge variant={prio.variant} className="shrink-0 text-[10px]">
                                {prio.label}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="mb-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 text-[10px] ${
                                  overdue ? "text-destructive" : dueSoon ? "text-status-away" : "text-muted-foreground"
                                }`}>
                                  {overdue ? (
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                  ) : (
                                    <Calendar className="h-2.5 w-2.5" />
                                  )}
                                  {new Date(task.dueDate).toLocaleDateString("zh-CN")}
                                </span>
                              )}
                              {task.assignedBy && (
                                <span className="text-[10px] text-muted-foreground">
                                  指派: {task.assignedBy}
                                </span>
                              )}
                            </div>
                            {task.status !== "done" && (
                              <div className="mt-2 flex gap-1">
                                {col.key === "todo" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px]"
                                    onClick={() => updateStatusMutation.mutate({ id: task.id, status: "in_progress" })}
                                  >
                                    开始 <ArrowRight className="ml-1 h-2.5 w-2.5" />
                                  </Button>
                                )}
                                {col.key === "in_progress" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px]"
                                    onClick={() => updateStatusMutation.mutate({ id: task.id, status: "done" })}
                                  >
                                    完成 <ArrowRight className="ml-1 h-2.5 w-2.5" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <KanbanSquare className="mb-2 h-8 w-8 opacity-20" />
                        <p className="text-xs">暂无任务</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
