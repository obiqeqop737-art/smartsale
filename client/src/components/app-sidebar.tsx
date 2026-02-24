import { useLocation, Link } from "wouter";
import { Brain, Radar, KanbanSquare, FileText, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { User } from "@shared/models/auth";
import { useState } from "react";

const navItems = [
  { title: "知识库 & 文档", url: "/knowledge", icon: Brain, desc: "文档管理与AI问答" },
  { title: "情报雷达", url: "/intelligence", icon: Radar, desc: "行业情报追踪" },
  { title: "任务看板", url: "/tasks", icon: KanbanSquare, desc: "任务管理" },
  { title: "每日总结", url: "/summary", icon: FileText, desc: "AI工作日报" },
];

interface AppSidebarProps {
  user: User;
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ user, collapsed, onToggle }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      className={`glass-sidebar flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      } shrink-0`}
      data-testid="sidebar"
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glow-btn">
          <Brain className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold tracking-tight text-white">DocuMind AI</span>
            <span className="text-[10px] text-blue-300/60">智能文档管理平台</span>
          </div>
        )}
      </div>

      <nav className="mt-2 flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.url || (item.url === "/knowledge" && location === "/");
          const linkContent = (
            <Link
              href={item.url}
              data-testid={`nav-${item.url.slice(1)}`}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group ${
                isActive
                  ? "glow-border-active bg-blue-500/10 text-blue-300"
                  : "text-slate-400 hover:text-blue-300 hover:bg-blue-500/5 hover:glow-border"
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"}`} />
              {!collapsed && <span className="text-sm truncate">{item.title}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.title} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
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
              <span className="truncate text-sm font-medium text-slate-200">
                {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email}
              </span>
              <span className="truncate text-[10px] text-slate-500">{user.email}</span>
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
