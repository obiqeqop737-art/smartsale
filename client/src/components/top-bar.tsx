import { useLocation } from "wouter";
import { Search, Bell, ChevronRight, Home, Sun, Moon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@shared/models/auth";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";

const routeNames: Record<string, string> = {
  "/": "工作台",
  "/dashboard": "工作台",
  "/knowledge": "知识库 & 文档",
  "/intelligence": "情报雷达",
  "/tasks": "任务看板",
  "/summary": "每日总结",
};

interface TopBarProps {
  user: User;
}

export function TopBar({ user }: TopBarProps) {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const currentPage = routeNames[location] || "DocuMind AI";

  return (
    <div className="h-12 border-b border-blue-500/10 bg-white/60 dark:bg-slate-950/40 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0" data-testid="top-bar">
      <div className="flex items-center gap-2 text-sm pl-10 md:pl-0">
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

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 relative"
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        </Button>

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
            <DropdownMenuItem asChild className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 focus:text-blue-600 dark:focus:text-blue-300 focus:bg-blue-500/10 cursor-pointer">
              <a href="/api/logout">退出登录</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
