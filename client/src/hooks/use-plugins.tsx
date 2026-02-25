import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { Receipt, Shield } from "lucide-react";

export interface ConnectedPlugin {
  id: string;
  name: string;
  icon: typeof Receipt;
  url: string;
  color: string;
}

const PLUGIN_REGISTRY: ConnectedPlugin[] = [
  { id: "expense", name: "报销审批", icon: Receipt, url: "/plugin/expense", color: "text-emerald-400" },
  { id: "crm", name: "CRM管理", icon: Shield, url: "/plugin/crm", color: "text-indigo-400" },
];

const STORAGE_KEY = "documind_connected_plugins";

interface PluginContextValue {
  connectedIds: string[];
  connect: (id: string) => void;
  disconnect: (id: string) => void;
  isConnected: (id: string) => boolean;
  connectedPlugins: ConnectedPlugin[];
}

const PluginContext = createContext<PluginContextValue | null>(null);

export function PluginProvider({ children }: { children: ReactNode }) {
  const [connectedIds, setConnectedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connectedIds));
  }, [connectedIds]);

  const connect = useCallback((id: string) => {
    setConnectedIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const disconnect = useCallback((id: string) => {
    setConnectedIds(prev => prev.filter(p => p !== id));
  }, []);

  const isConnected = useCallback((id: string) => connectedIds.includes(id), [connectedIds]);

  const connectedPlugins = PLUGIN_REGISTRY.filter(p => connectedIds.includes(p.id));

  return (
    <PluginContext.Provider value={{ connectedIds, connect, disconnect, isConnected, connectedPlugins }}>
      {children}
    </PluginContext.Provider>
  );
}

export function usePlugins() {
  const ctx = useContext(PluginContext);
  if (!ctx) throw new Error("usePlugins must be used within PluginProvider");
  return ctx;
}
