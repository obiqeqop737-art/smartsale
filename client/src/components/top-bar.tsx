import { useLocation, Link } from "wouter";
import { Search, Bell, ChevronRight, Home, Sun, Moon, Menu, UserCircle, LogOut, Check, CheckCheck, Trash2, FileText, MessageSquare, CheckCircle2, Newspaper, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { User } from "@shared/models/auth";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const routeNames: Record<string, string> = {
  "/": "工作台",
  "/dashboard": "工作台",
  "/knowledge": "知识库 & 文档",
  "/intelligence": "情报雷达",
  "/tasks": "任务看板",
  "/summary": "每日总结",
  "/profile": "个人中心",
};

const notifIconMap: Record<string, typeof Bell> = {
  summary_received: FileText,
  task_comment: MessageSquare,
  task_completed: CheckCircle2,
  intelligence_update: Newspaper,
  system: Info,
};

const notifColorMap: Record<string, string> = {
  summary_received: "text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15",
  task_comment: "text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15",
  task_completed: "text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15",
  intelligence_update: "text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15",
  system: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-500/15",
};

function formatTimeAgo(date: string | Date) {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  return new Date(date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

interface TopBarProps {
  user: User;
  isMobile?: boolean;
  onMenuClick?: () => void;
}

export function TopBar({ user, isMobile, onMenuClick }: TopBarProps) {
  const [location, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const currentPage = routeNames[location] || "DocuMind AI";

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 15000,
  });
  const unreadCount = unreadData?.count || 0;

  const { data: notifList } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: notifOpen,
  });

  const markReadMut = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const handleNotifClick = (notif: any) => {
    if (!notif.isRead) markReadMut.mutate(notif.id);
    if (notif.relatedType === "task") setLocation("/tasks");
    else if (notif.relatedType === "daily_summary") setLocation("/summary");
    else if (notif.relatedType === "intelligence") setLocation("/intelligence");
    setNotifOpen(false);
  };

  return (
    <div className="h-12 border-b border-blue-500/10 bg-white/60 dark:bg-slate-950/40 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0" data-testid="top-bar">
      <div className="flex items-center gap-2 text-sm">
        {isMobile && onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0 -ml-1 mr-1"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Home className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 hidden md:block" />
        <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700 hidden md:block" />
        <span className="text-slate-700 dark:text-slate-300 font-medium text-xs md:text-sm truncate">{currentPage}</span>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <div className={`flex items-center transition-all duration-300 ${searchOpen ? "w-36 md:w-64" : "w-8"}`}>
          {searchOpen ? (
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="搜索文档、任务..."
                autoFocus
                onBlur={() => setSearchOpen(false)}
                className="w-full h-8 pl-8 pr-3 rounded-lg text-xs glass-input text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                data-testid="input-global-search"
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
              data-testid="button-search-toggle"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 dark:text-slate-500 dark:hover:text-blue-400"
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 relative"
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-blue-500 text-[10px] text-white font-medium flex items-center justify-center px-1 animate-pulse" data-testid="badge-unread-count">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 md:w-96 p-0 glass-dialog border-blue-500/20" data-testid="panel-notifications">
            <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/10">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">消息通知</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMut.mutate()}
                    className="text-[11px] text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1"
                    data-testid="button-mark-all-read"
                  >
                    <CheckCheck className="h-3 w-3" />
                    全部已读
                  </button>
                )}
              </div>
            </div>
            <ScrollArea className="max-h-[400px]">
              {notifList && notifList.length > 0 ? (
                <div className="divide-y divide-blue-500/5">
                  {notifList.map((notif: any) => {
                    const Icon = notifIconMap[notif.type] || Bell;
                    const colorClass = notifColorMap[notif.type] || notifColorMap.system;
                    return (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-blue-500/5 ${
                          !notif.isRead ? "bg-blue-500/[0.03] dark:bg-blue-500/[0.06]" : ""
                        }`}
                        onClick={() => handleNotifClick(notif)}
                        data-testid={`notification-item-${notif.id}`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-medium truncate ${!notif.isRead ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}>
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5 line-clamp-2">{notif.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {notif.fromUserName && (
                              <span className="text-[10px] text-blue-500/70 dark:text-blue-400/60">{notif.fromUserName}</span>
                            )}
                            <span className="text-[10px] text-slate-400 dark:text-slate-600">{formatTimeAgo(notif.createdAt)}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMut.mutate(notif.id); }}
                          className="text-slate-400 hover:text-red-400 shrink-0 mt-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10"
                          data-testid={`button-delete-notification-${notif.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600">
                  <Bell className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs">暂无消息通知</p>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-blue-500/5 transition-colors" data-testid="button-user-menu">
              <Avatar className="h-7 w-7 border border-blue-500/20">
                <AvatarImage src={user.profileImageUrl || ""} />
                <AvatarFallback className="bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xs">
                  {(user.firstName || "U")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">
                {user.firstName || "用户"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-dialog border-blue-500/20 w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-blue-500/10" />
            <DropdownMenuItem asChild className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 focus:text-blue-600 dark:focus:text-blue-300 focus:bg-blue-500/10 cursor-pointer">
              <Link href="/profile" data-testid="link-profile">
                <UserCircle className="h-4 w-4 mr-2" />
                个人中心
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 focus:text-red-500 dark:focus:text-red-400 focus:bg-red-500/10 cursor-pointer">
              <a href="/api/logout" data-testid="link-logout">
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
