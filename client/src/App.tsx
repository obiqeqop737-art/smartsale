import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { PluginProvider } from "@/hooks/use-plugins";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import KnowledgePage from "@/pages/knowledge";
import IntelligencePage from "@/pages/intelligence";
import TasksPage from "@/pages/tasks";
import SummaryPage from "@/pages/summary";
import AdminPage from "@/pages/admin";
import PluginsPage from "@/pages/plugins";
import ProfilePage from "@/pages/profile";
import PluginExpensePage from "@/pages/plugin-expense";
import PluginCrmPage from "@/pages/plugin-crm";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <span className="text-sm text-blue-300/60">系统加载中...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {isMobile && (
        <>
          <div
            className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={`fixed inset-y-0 left-0 z-[70] w-64 transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <AppSidebar user={user} collapsed={false} onToggle={() => setMobileMenuOpen(false)} onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}
      {!isMobile && (
        <AppSidebar user={user} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} isMobile={isMobile} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/knowledge" component={KnowledgePage} />
            <Route path="/intelligence" component={IntelligencePage} />
            <Route path="/tasks" component={TasksPage} />
            <Route path="/summary" component={SummaryPage} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/plugins" component={PluginsPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/plugin/expense" component={PluginExpensePage} />
            <Route path="/plugin/crm" component={PluginCrmPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <PluginProvider>
            <Toaster />
            <AuthenticatedApp />
          </PluginProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
