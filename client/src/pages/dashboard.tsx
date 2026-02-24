import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  FileText,
  FolderTree,
  KanbanSquare,
  Radar,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Brain,
  Calendar,
  Upload,
  MessageSquare,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, KnowledgeFile, IntelligencePost, ActivityLog } from "@shared/schema";

function AnimatedNumber({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    const start = performance.now();
    const from = ref.current;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(from + (target - from) * eased);
      setCurrent(val);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = target;
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{current}</span>;
}

const activityIconMap: Record<string, typeof FileText> = {
  upload_file: Upload,
  chat: MessageSquare,
  complete_task: CheckCircle2,
  view_intelligence: Eye,
  generate_summary: FileText,
};

const activityModuleColors: Record<string, string> = {
  knowledge: "text-blue-400",
  tasks: "text-emerald-400",
  intelligence: "text-purple-400",
  summary: "text-amber-400",
};

interface DashboardStats {
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
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard-stats"],
  });

  const taskCompletionRate = stats && stats.taskTotal > 0
    ? Math.round((stats.taskDone / stats.taskTotal) * 100) : 0;

  const statCards = [
    {
      label: "知识文档",
      value: stats?.fileCount ?? 0,
      sub: `${stats?.folderCount ?? 0} 个文件夹`,
      icon: FileText,
      color: "from-blue-500/20 to-blue-600/10",
      iconBg: "bg-blue-500/15 border-blue-500/25",
      iconColor: "text-blue-400",
      link: "/knowledge",
    },
    {
      label: "任务完成率",
      value: taskCompletionRate,
      suffix: "%",
      sub: `${stats?.taskDone ?? 0}/${stats?.taskTotal ?? 0} 已完成`,
      icon: KanbanSquare,
      color: "from-emerald-500/20 to-emerald-600/10",
      iconBg: "bg-emerald-500/15 border-emerald-500/25",
      iconColor: "text-emerald-400",
      link: "/tasks",
    },
    {
      label: "情报总数",
      value: stats?.intelCount ?? 0,
      sub: "行业情报追踪",
      icon: Radar,
      color: "from-purple-500/20 to-purple-600/10",
      iconBg: "bg-purple-500/15 border-purple-500/25",
      iconColor: "text-purple-400",
      link: "/intelligence",
    },
    {
      label: "今日活动",
      value: stats?.activityTodayCount ?? 0,
      sub: "操作记录",
      icon: Activity,
      color: "from-amber-500/20 to-amber-600/10",
      iconBg: "bg-amber-500/15 border-amber-500/25",
      iconColor: "text-amber-400",
      link: "/summary",
    },
  ];

  const priorityColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const formatTime = (d: string | Date) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6" data-testid="page-dashboard">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl glass-card animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl glass-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-blue-400" />
            </div>
            工作台
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.link}>
            <div className={`glass-card glass-card-hover rounded-xl p-5 cursor-pointer transition-all duration-300 group relative overflow-hidden`}
                 data-testid={`stat-card-${card.label}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
                    <AnimatedNumber target={card.value} />
                    {card.suffix && <span className="text-lg ml-0.5">{card.suffix}</span>}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{card.sub}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${card.iconBg} border flex items-center justify-center transition-all group-hover:scale-110`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-xl overflow-hidden lg:col-span-1" data-testid="section-recent-tasks">
          <div className="glass-dialog-header px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KanbanSquare className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-200">待办任务</span>
            </div>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 px-2" data-testid="link-view-all-tasks">
                查看全部 <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <ScrollArea className="h-[280px]">
            <div className="p-3 space-y-2">
              {(!stats?.recentTasks || stats.recentTasks.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mb-3" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">暂无待办任务</p>
                </div>
              ) : (
                stats.recentTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 rounded-lg p-3 hover:bg-blue-500/5 transition-colors group" data-testid={`task-item-${task.id}`}>
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${task.status === "in_progress" ? "bg-blue-400 animate-pulse" : "bg-slate-600"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${priorityColors[task.priority] || priorityColors.medium}`}>
                          {task.priority === "high" ? "高" : task.priority === "low" ? "低" : "中"}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-600 flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(task.dueDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="glass-card rounded-xl overflow-hidden lg:col-span-1" data-testid="section-recent-files">
          <div className="glass-dialog-header px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-200">最近文档</span>
            </div>
            <Link href="/knowledge">
              <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 px-2" data-testid="link-view-all-files">
                查看全部 <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <ScrollArea className="h-[280px]">
            <div className="p-3 space-y-2">
              {(!stats?.recentFiles || stats.recentFiles.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FolderTree className="h-10 w-10 text-blue-500/20 mb-3" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">暂无文档</p>
                  <Link href="/knowledge">
                    <Button variant="ghost" size="sm" className="mt-2 text-xs text-blue-400">去上传</Button>
                  </Link>
                </div>
              ) : (
                stats.recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-blue-500/5 transition-colors" data-testid={`file-item-${file.id}`}>
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{file.fileName}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
                        {formatFileSize(file.fileSize)} · {formatTime(file.uploadedAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="glass-card rounded-xl overflow-hidden lg:col-span-1" data-testid="section-recent-intel">
          <div className="glass-dialog-header px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-200">最新情报</span>
            </div>
            <Link href="/intelligence">
              <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 px-2" data-testid="link-view-all-intel">
                查看全部 <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <ScrollArea className="h-[280px]">
            <div className="p-3 space-y-2">
              {(!stats?.recentIntel || stats.recentIntel.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Radar className="h-10 w-10 text-purple-500/20 mb-3" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">暂无情报</p>
                </div>
              ) : (
                stats.recentIntel.map((post) => (
                  <Link key={post.id} href="/intelligence">
                    <div className="rounded-lg p-3 hover:bg-blue-500/5 transition-colors cursor-pointer" data-testid={`intel-item-${post.id}`}>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{post.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-600">{post.source}</span>
                        <span className="text-[10px] text-slate-700">·</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-600">{formatTime(post.publishedAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden" data-testid="section-activity">
          <div className="glass-dialog-header px-5 py-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-200">今日动态</span>
            <Badge variant="outline" className="ml-2 text-[10px] h-5 bg-blue-500/10 text-blue-400 border-blue-500/20">
              {stats.recentActivity.length} 条记录
            </Badge>
          </div>
          <div className="p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {stats.recentActivity.map((activity) => {
                const Icon = activityIconMap[activity.action] || Activity;
                const modColor = activityModuleColors[activity.module] || "text-slate-400";
                return (
                  <div key={activity.id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-blue-500/5 transition-colors" data-testid={`activity-item-${activity.id}`}>
                    <div className="h-7 w-7 rounded-md bg-slate-800/50 border border-slate-700/50 flex items-center justify-center shrink-0">
                      <Icon className={`h-3.5 w-3.5 ${modColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{activity.detail || activity.action}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-600">{formatTime(activity.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
