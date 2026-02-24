import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import KnowledgePage from "@/pages/knowledge";
import IntelligencePage from "@/pages/intelligence";
import TasksPage from "@/pages/tasks";
import SummaryPage from "@/pages/summary";
import { Menu } from "lucide-react";

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
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="fixed top-3 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg glass-card text-blue-400"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
              <div className="h-full w-60" onClick={(e) => e.stopPropagation()}>
                <AppSidebar user={user} collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          )}
        </>
      )}
      {!isMobile && (
        <AppSidebar user={user} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      )}
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={KnowledgePage} />
          <Route path="/knowledge" component={KnowledgePage} />
          <Route path="/intelligence" component={IntelligencePage} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/summary" component={SummaryPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthenticatedApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
