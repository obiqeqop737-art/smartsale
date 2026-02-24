import { useLocation, Link } from "wouter";
import { Brain, Radar, KanbanSquare, FileText, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/models/auth";

const navItems = [
  { title: "知识库 & 问答", url: "/knowledge", icon: Brain },
  { title: "情报雷达", url: "/intelligence", icon: Radar },
  { title: "任务看板", url: "/tasks", icon: KanbanSquare },
  { title: "每日总结", url: "/summary", icon: FileText },
];

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">Sales AI Agent</span>
            <span className="text-xs text-muted-foreground">智能销售助手</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>功能模块</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url || (item.url === "/knowledge" && location === "/")}
                  >
                    <Link href={item.url} data-testid={`nav-${item.url.slice(1)}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImageUrl || ""} />
            <AvatarFallback className="bg-primary/20 text-xs">
              {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">
              {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email}
            </span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            asChild
            data-testid="button-logout"
          >
            <a href="/api/logout">
              <LogOut className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
