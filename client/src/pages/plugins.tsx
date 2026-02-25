import { useState } from "react";
import {
  Puzzle,
  Plug,
  Receipt,
  Factory,
  Users,
  Mail,
  Calendar,
  Shield,
  Zap,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePlugins } from "@/hooks/use-plugins";

interface PluginCard {
  id: string;
  name: string;
  description: string;
  icon: typeof Puzzle;
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  status: "available" | "connected" | "coming_soon";
  category: string;
}

const pluginCards: PluginCard[] = [
  {
    id: "expense",
    name: "内部报销审批",
    description: "对接企业OA报销流程，自动关联差旅与客户拜访记录，一键提交审批",
    icon: Receipt,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
    bgColor: "bg-emerald-500/10",
    glowColor: "shadow-emerald-500/10 hover:shadow-emerald-500/20",
    status: "available",
    category: "财务管理",
  },
  {
    id: "crm",
    name: "CRM客户管理",
    description: "全流程客户关系管理，销售漏斗追踪，内置BI数据看板与客户画像分析",
    icon: Shield,
    color: "text-indigo-400",
    borderColor: "border-indigo-500/20 hover:border-indigo-500/40",
    bgColor: "bg-indigo-500/10",
    glowColor: "shadow-indigo-500/10 hover:shadow-indigo-500/20",
    status: "available",
    category: "销售管理",
  },
  {
    id: "factory",
    name: "工厂排产进度查询",
    description: "实时同步工厂MES排产数据，追踪订单生产进度与交付节点",
    icon: Factory,
    color: "text-blue-400",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
    bgColor: "bg-blue-500/10",
    glowColor: "shadow-blue-500/10 hover:shadow-blue-500/20",
    status: "coming_soon",
    category: "生产制造",
  },
  {
    id: "wecom",
    name: "企业微信通讯录",
    description: "同步企业微信组织架构与通讯录，快速查找联系人并发起沟通",
    icon: Users,
    color: "text-purple-400",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
    bgColor: "bg-purple-500/10",
    glowColor: "shadow-purple-500/10 hover:shadow-purple-500/20",
    status: "coming_soon",
    category: "协同办公",
  },
  {
    id: "email",
    name: "邮件集成",
    description: "对接企业邮箱，自动归档客户往来邮件，智能提取关键信息",
    icon: Mail,
    color: "text-rose-400",
    borderColor: "border-rose-500/20 hover:border-rose-500/40",
    bgColor: "bg-rose-500/10",
    glowColor: "shadow-rose-500/10 hover:shadow-rose-500/20",
    status: "coming_soon",
    category: "协同办公",
  },
  {
    id: "calendar",
    name: "日程同步",
    description: "与Outlook/Google日历双向同步，智能规划客户拜访与内部会议时间",
    icon: Calendar,
    color: "text-cyan-400",
    borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
    bgColor: "bg-cyan-500/10",
    glowColor: "shadow-cyan-500/10 hover:shadow-cyan-500/20",
    status: "coming_soon",
    category: "协同办公",
  },
  {
    id: "workflow",
    name: "自动化工作流",
    description: "配置自动化触发规则，如新客户自动建档、逾期任务自动提醒",
    icon: Zap,
    color: "text-orange-400",
    borderColor: "border-orange-500/20 hover:border-orange-500/40",
    bgColor: "bg-orange-500/10",
    glowColor: "shadow-orange-500/10 hover:shadow-orange-500/20",
    status: "coming_soon",
    category: "效率工具",
  },
];

export default function PluginsPage() {
  const { toast } = useToast();
  const { isConnected, connect, disconnect } = usePlugins();
  const [confirmDialog, setConfirmDialog] = useState<PluginCard | null>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<PluginCard | null>(null);

  const getPluginStatus = (plugin: PluginCard): PluginCard["status"] => {
    if (plugin.status === "coming_soon") return "coming_soon";
    return isConnected(plugin.id) ? "connected" : "available";
  };

  const handleConnect = (plugin: PluginCard) => {
    const status = getPluginStatus(plugin);
    if (status === "coming_soon") {
      toast({ title: "即将上线", description: `「${plugin.name}」正在开发中，敬请期待` });
      return;
    }
    if (status === "connected") {
      setDisconnectDialog(plugin);
      return;
    }
    setConfirmDialog(plugin);
  };

  const confirmConnect = () => {
    if (!confirmDialog) return;
    connect(confirmDialog.id);
    toast({ title: "接入成功", description: `「${confirmDialog.name}」已成功连接，可在左侧菜单中访问` });
    setConfirmDialog(null);
  };

  const confirmDisconnect = () => {
    if (!disconnectDialog) return;
    disconnect(disconnectDialog.id);
    toast({ title: "已断开", description: `「${disconnectDialog.name}」已断开连接` });
    setDisconnectDialog(null);
  };

  const connectedCount = pluginCards.filter(p => p.status !== "coming_soon" && isConnected(p.id)).length;

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-plugins">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
              <Puzzle className="h-5 w-5 text-purple-400" />
            </div>
            插件中心
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">接入企业生态插件，打通数据孤岛</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            {connectedCount} 已连接
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 bg-blue-500/10 text-blue-400 border-blue-500/20">
            {pluginCards.length} 个插件
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pluginCards.map((plugin) => {
          const Icon = plugin.icon;
          const status = getPluginStatus(plugin);
          const pluginConnected = status === "connected";
          const isComingSoon = status === "coming_soon";

          return (
            <div
              key={plugin.id}
              className={`glass-card glass-card-hover rounded-xl p-5 transition-all duration-300 group relative overflow-hidden cursor-pointer border ${plugin.borderColor} shadow-lg ${plugin.glowColor} ${isComingSoon ? "opacity-60" : ""}`}
              onClick={() => handleConnect(plugin)}
              data-testid={`plugin-card-${plugin.id}`}
            >
              {pluginConnected && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5" data-testid={`plugin-connected-${plugin.id}`}>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-medium text-emerald-400">已连接</span>
                </div>
              )}
              {isComingSoon && (
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="text-[9px] h-4 bg-slate-500/10 text-slate-400 border-slate-500/20">
                    敬请期待
                  </Badge>
                </div>
              )}

              <div className={`h-12 w-12 rounded-xl ${plugin.bgColor} border ${plugin.borderColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <Icon className={`h-6 w-6 ${plugin.color}`} />
              </div>

              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{plugin.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4 line-clamp-2">{plugin.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-600">{plugin.category}</span>
                <Button
                  variant={pluginConnected ? "outline" : "default"}
                  size="sm"
                  className={`h-7 text-xs px-3 gap-1 ${
                    pluginConnected
                      ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      : isComingSoon
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "glow-btn text-white border-0"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnect(plugin);
                  }}
                  data-testid={`button-connect-${plugin.id}`}
                >
                  {pluginConnected ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      管理
                    </>
                  ) : isComingSoon ? (
                    "敬请期待"
                  ) : (
                    <>
                      <Plug className="h-3 w-3" />
                      接入
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center" data-testid="dialog-connect">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className="relative glass-dialog rounded-2xl border border-blue-500/15 w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="glass-dialog-header px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">授权确认</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmDialog(null)}
                className="h-7 w-7 text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-xl ${confirmDialog.bgColor} border ${confirmDialog.borderColor} flex items-center justify-center`}>
                  <confirmDialog.icon className={`h-7 w-7 ${confirmDialog.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{confirmDialog.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{confirmDialog.category}</p>
                </div>
              </div>
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  接入此插件后，将允许其访问您平台中的相关数据。请确认您已了解该插件的数据使用范围。
                </p>
              </div>
            </div>
            <div className="border-t border-blue-500/10 px-6 py-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 border-slate-600 text-slate-400 hover:bg-slate-800/50"
                data-testid="button-cancel-connect"
              >
                取消
              </Button>
              <Button
                onClick={confirmConnect}
                className="flex-1 glow-btn text-white border-0 font-medium gap-2"
                data-testid="button-confirm-connect"
              >
                <Plug className="h-4 w-4" />
                确认接入
              </Button>
            </div>
          </div>
        </div>
      )}

      {disconnectDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center" data-testid="dialog-disconnect">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDisconnectDialog(null)} />
          <div className="relative glass-dialog rounded-2xl border border-blue-500/15 w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="glass-dialog-header px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">管理插件</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDisconnectDialog(null)}
                className="h-7 w-7 text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-xl ${disconnectDialog.bgColor} border ${disconnectDialog.borderColor} flex items-center justify-center`}>
                  <disconnectDialog.icon className={`h-7 w-7 ${disconnectDialog.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{disconnectDialog.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] text-emerald-400">已连接</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                断开后将停止数据同步，并从左侧菜单中移除入口。已同步的数据不会被删除，可随时重新接入。
              </p>
            </div>
            <div className="border-t border-blue-500/10 px-6 py-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDisconnectDialog(null)}
                className="flex-1 border-slate-600 text-slate-400 hover:bg-slate-800/50"
                data-testid="button-cancel-disconnect"
              >
                保持连接
              </Button>
              <Button
                onClick={confirmDisconnect}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 font-medium"
                data-testid="button-confirm-disconnect"
              >
                断开连接
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
