import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Brain, Radar, KanbanSquare, FileText, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Puzzle, Shield, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { User } from "@shared/models/auth";
import type { Task, IntelligencePost } from "@shared/schema";

const navItems = [
  { title: "工作台", url: "/", altUrl: "/dashboard", icon: LayoutDashboard, desc: "数据概览", badgeKey: null as string | null },
  { title: "知识库", url: "/knowledge", altUrl: null, icon: Brain, desc: "文档管理与AI问答", badgeKey: null },
  { title: "情报雷达", url: "/intelligence", altUrl: null, icon: Radar, desc: "行业情报追踪", badgeKey: "intel" },
  { title: "任务看板", url: "/tasks", altUrl: null, icon: KanbanSquare, desc: "任务管理", badgeKey: "tasks" },
  { title: "每日总结", url: "/summary", altUrl: null, icon: FileText, desc: "AI工作日报", badgeKey: null },
  { title: "个人中心", url: "/profile", altUrl: null, icon: UserIcon, desc: "个人信息设置", badgeKey: null },
];

const bottomNavItems = [
  { title: "插件中心", url: "/plugins", altUrl: null, icon: Puzzle, desc: "接入企业生态插件", badgeKey: null as string | null },
  { title: "超管台", url: "/admin", altUrl: null, icon: Shield, desc: "用户管理与资产交接", badgeKey: null },
];

interface AppSidebarProps {
  user: User;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

export function AppSidebar({ user, collapsed, onToggle, onNavigate }: AppSidebarProps) {
  const [location] = useLocation();

  const { data: tasksData } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: intelData } = useQuery<IntelligencePost[]>({ queryKey: ["/api/intelligence-posts"] });

  const todoCount = tasksData?.filter(t => t.status === "todo").length ?? 0;
  const intelCount = intelData?.length ?? 0;

  const badges: Record<string, number> = {
    tasks: todoCount,
    intel: intelCount,
  };

  return (
    <aside
      className={`glass-sidebar flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      } shrink-0 relative z-30`}
      data-testid="sidebar"
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glow-btn">
          <Brain className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">DocuMind AI</span>
            <span className="text-[10px] text-blue-500/60 dark:text-blue-300/60">智能文档管理平台</span>
          </div>
        )}
      </div>

      <nav className="mt-2 flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.url || location === item.altUrl;
          const badgeVal = item.badgeKey ? badges[item.badgeKey] : 0;
          const linkContent = (
            <Link
              href={item.url}
              onClick={() => onNavigate?.()}
              data-testid={`nav-${item.url === "/" ? "dashboard" : item.url.slice(1)}`}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group ${
                isActive
                  ? "glow-border-active bg-blue-500/10 text-blue-600 dark:text-blue-300"
                  : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-500/5 hover:glow-border"
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"}`} />
              {!collapsed && (
                <>
                  <span className="text-sm truncate flex-1">{item.title}</span>
                  {badgeVal > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500/15 px-1.5 text-[10px] font-medium text-blue-400 border border-blue-500/20">
                      {badgeVal > 99 ? "99+" : badgeVal}
                    </span>
                  )}
                </>
              )}
              {collapsed && badgeVal > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.title} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="relative">{linkContent}</div>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass-dialog text-blue-200 border-blue-500/20">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-blue-300/50">{item.desc}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          return <div key={item.title}>{linkContent}</div>;
        })}
      </nav>

      <div className="px-2 space-y-1 mb-2">
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <span className="text-[10px] font-medium text-slate-400/60 dark:text-slate-600 uppercase tracking-widest">扩展</span>
          </div>
        )}
        {bottomNavItems.map((item) => {
          if (item.url === "/admin" && user.role !== "admin") return null;
          const isActive = location === item.url || location === item.altUrl;
          const navLink = (
            <Link
              href={item.url}
              onClick={() => onNavigate?.()}
              data-testid={`nav-${item.url.slice(1)}`}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group ${
                isActive
                  ? "glow-border-active bg-blue-500/10 text-blue-600 dark:text-blue-300"
                  : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-500/5 hover:glow-border"
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"}`} />
              {!collapsed && <span className="text-sm truncate flex-1">{item.title}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.title} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="relative">{navLink}</div>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass-dialog text-blue-200 border-blue-500/20">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-blue-300/50">{item.desc}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          return <div key={item.title}>{navLink}</div>;
        })}
      </div>

      <div className="mt-auto border-t border-blue-500/10 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0 border border-blue-500/20">
            <AvatarImage src={user.profileImageUrl || ""} />
            <AvatarFallback className="bg-blue-500/15 text-xs text-blue-300">
              {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email}
              </span>
              <span className="truncate text-[10px] text-slate-400 dark:text-slate-500">{user.email}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-7 w-7 shrink-0 text-slate-500 hover:text-blue-400"
            data-testid="button-logout"
          >
            <a href="/api/logout">
              <LogOut className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      <button
        onClick={onToggle}
        className="mx-auto mb-3 flex h-6 w-6 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 transition-all hover:bg-blue-500/20"
        data-testid="button-sidebar-toggle"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
