import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  CheckCircle,
  Loader2,
  Calendar,
  Clock,
  Send,
  Inbox,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  Brain,
} from "lucide-react";
import type { DailySummary } from "@shared/schema";

type ReceivedSummary = DailySummary & { userName?: string; profileImageUrl?: string };

type DateGroup = {
  date: string;
  summaries: ReceivedSummary[];
};

export default function SummaryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [viewMode, setViewMode] = useState<"my" | "received">("my");
  const [selectedReceivedId, setSelectedReceivedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [teamSummaryDate, setTeamSummaryDate] = useState<string | null>(null);
  const [isGeneratingTeam, setIsGeneratingTeam] = useState(false);

  const { data: historyList = [] } = useQuery<DailySummary[]>({
    queryKey: ["/api/daily-summaries"],
  });

  const { data: receivedList = [] } = useQuery<ReceivedSummary[]>({
    queryKey: ["/api/daily-summaries/received"],
  });

  const dateGroups = useMemo<DateGroup[]>(() => {
    const map = new Map<string, ReceivedSummary[]>();
    for (const s of receivedList) {
      const existing = map.get(s.date) || [];
      existing.push(s);
      map.set(s.date, existing);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, summaries]) => ({ date, summaries }));
  }, [receivedList]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/daily-summary", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  content += data.content;
                  setSummaryContent(content);
                }
              } catch {}
            }
          }
        }
      }
      return content;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summaries"] });
    },
    onError: (e: Error) => {
      toast({ title: "生成失败", description: e.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/daily-summary/${id}/send`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summaries"] });
      toast({ title: "发送成功", description: "日报已发送给领导" });
    },
    onError: (e: Error) => {
      toast({ title: "发送失败", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/daily-summary/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summaries"] });
      if (selectedHistoryId === deleteId) {
        setSelectedHistoryId(null);
        setSummaryContent("");
      }
      setDeleteId(null);
      toast({ title: "已删除日报" });
    },
    onError: (e: Error) => {
      setDeleteId(null);
      toast({ title: "删除失败", description: e.message, variant: "destructive" });
    },
  });

  const handleGenerateTeamSummary = async (date: string) => {
    setTeamSummaryDate(date);
    setSelectedReceivedId(null);
    setSelectedHistoryId(null);
    setIsGeneratingTeam(true);
    setSummaryContent("");
    setViewMode("received");

    try {
      const res = await fetch("/api/daily-summaries/team-summary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  content += data.content;
                  setSummaryContent(content);
                }
              } catch {}
            }
          }
        }
      }
    } catch (e: any) {
      toast({ title: "生成失败", description: e.message, variant: "destructive" });
    } finally {
      setIsGeneratingTeam(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryContent);
      setCopied(true);
      toast({ title: "已复制到剪贴板" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const blob = new Blob([summaryContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `工作日报_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "导出成功" });
  };

  const handleSelectHistory = (item: DailySummary) => {
    setSelectedHistoryId(item.id);
    setSelectedReceivedId(null);
    setTeamSummaryDate(null);
    setSummaryContent(item.content);
    setViewMode("my");
  };

  const handleSelectReceived = (item: ReceivedSummary) => {
    setSelectedReceivedId(item.id);
    setSelectedHistoryId(null);
    setTeamSummaryDate(null);
    setSummaryContent(item.content);
    setViewMode("received");
  };

  const toggleDateExpand = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const formatHistoryDate = (date: string) => {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  };

  const formatHistoryDay = (date: string) => {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("zh-CN", { weekday: "short" });
  };

  const today = new Date().toISOString().slice(0, 10);
  const todaySentSummary = historyList.find(h => h.date === today && h.status === "sent");
  const currentSelectedSummary = selectedHistoryId ? historyList.find(h => h.id === selectedHistoryId) : null;
  const currentReceivedSummary = selectedReceivedId ? receivedList.find(r => r.id === selectedReceivedId) : null;

  const activeSummaryId = selectedHistoryId || (historyList.length > 0 ? historyList[0]?.id : null);
  const isCurrentSent = currentSelectedSummary?.status === "sent" || (!selectedHistoryId && todaySentSummary);

  const headerTitle = (() => {
    if (teamSummaryDate) {
      return { icon: <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />, text: `团队 AI 汇总 - ${formatHistoryDate(teamSummaryDate)}`, color: "text-purple-700 dark:text-purple-200" };
    }
    if (viewMode === "received" && currentReceivedSummary) {
      return { icon: <Users className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />, text: `${currentReceivedSummary.userName || "未知用户"} 的日报 - ${formatHistoryDate(currentReceivedSummary.date)}`, color: "text-amber-700 dark:text-amber-200" };
    }
    return {
      icon: <FileText className="h-4 w-4 text-blue-400 shrink-0" />,
      text: selectedHistoryId
        ? `历史日报 - ${historyList.find(h => h.id === selectedHistoryId)?.date || ""}`
        : `工作日报 - ${new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}`,
      color: "text-blue-700 dark:text-blue-200"
    };
  })();

  return (
    <div className="flex h-full" data-testid="page-summary">
      {showHistory && (
        <div className="w-64 shrink-0 border-r border-blue-500/10 flex-col bg-slate-50/50 dark:bg-slate-950/30 hidden md:flex" data-testid="summary-history-sidebar">
          <div className="px-4 py-3 border-b border-blue-500/10">
            <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5 border border-slate-200 dark:border-blue-500/10">
              <button
                onClick={() => setViewMode("my")}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                  viewMode === "my"
                    ? "bg-white dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
                data-testid="button-view-my-summaries"
              >
                <Clock className="h-3 w-3" />
                我的日报
              </button>
              <button
                onClick={() => setViewMode("received")}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                  viewMode === "received"
                    ? "bg-white dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
                data-testid="button-view-received-summaries"
              >
                <Inbox className="h-3 w-3" />
                收到的
                {receivedList.length > 0 && (
                  <span className="ml-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full px-1.5 text-[10px]">
                    {receivedList.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {viewMode === "my" ? (
              <div className="p-2 space-y-1">
                {historyList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FileText className="h-8 w-8 text-blue-500/15 mb-2" />
                    <p className="text-xs text-slate-400 dark:text-slate-600">暂无历史日报</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-700 mt-1">生成日报后将保存在此处</p>
                  </div>
                ) : (
                  historyList.map((item) => (
                    <div
                      key={item.id}
                      className={`group w-full text-left rounded-lg p-3 transition-all cursor-pointer ${
                        selectedHistoryId === item.id
                          ? "bg-blue-500/10 border border-blue-500/20 glow-border-active"
                          : "hover:bg-blue-500/5 border border-transparent"
                      }`}
                      onClick={() => handleSelectHistory(item)}
                      data-testid={`history-item-${item.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-blue-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{formatHistoryDate(item.date)}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-600">{formatHistoryDay(item.date)}</span>
                        {item.status === "sent" ? (
                          <Badge className="ml-auto text-[9px] h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20 px-1">
                            已发送
                          </Badge>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}
                            className="ml-auto p-0.5 rounded text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            data-testid={`button-delete-summary-${item.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 pl-5">
                        {item.content.slice(0, 80)}...
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {dateGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Inbox className="h-8 w-8 text-blue-500/15 mb-2" />
                    <p className="text-xs text-slate-400 dark:text-slate-600">暂无收到的日报</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-700 mt-1">下属发送的日报将显示在此处</p>
                  </div>
                ) : (
                  dateGroups.map((group) => {
                    const isExpanded = expandedDates.has(group.date);
                    return (
                      <div key={group.date}>
                        <button
                          onClick={() => toggleDateExpand(group.date)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-amber-500/5 transition-all"
                          data-testid={`date-group-${group.date}`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-amber-500 dark:text-amber-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                          )}
                          <Calendar className="h-3 w-3 text-amber-500 dark:text-amber-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatHistoryDate(group.date)}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-600">{formatHistoryDay(group.date)}</span>
                          <span className="ml-auto text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full px-1.5">
                            {group.summaries.length}人
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="ml-3 pl-2.5 border-l border-amber-500/15 space-y-0.5 pb-1">
                            <button
                              onClick={() => handleGenerateTeamSummary(group.date)}
                              disabled={isGeneratingTeam && teamSummaryDate === group.date}
                              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-all ${
                                teamSummaryDate === group.date
                                  ? "bg-purple-500/10 border border-purple-500/20"
                                  : "hover:bg-purple-500/5 border border-transparent"
                              }`}
                              data-testid={`button-team-summary-${group.date}`}
                            >
                              {isGeneratingTeam && teamSummaryDate === group.date ? (
                                <Loader2 className="h-3 w-3 text-purple-500 dark:text-purple-400 shrink-0 animate-spin" />
                              ) : (
                                <Brain className="h-3 w-3 text-purple-500 dark:text-purple-400 shrink-0" />
                              )}
                              <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                                {isGeneratingTeam && teamSummaryDate === group.date ? "生成中..." : "AI 团队汇总"}
                              </span>
                            </button>

                            {group.summaries.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleSelectReceived(item)}
                                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-all ${
                                  selectedReceivedId === item.id
                                    ? "bg-amber-500/10 border border-amber-500/20"
                                    : "hover:bg-amber-500/5 border border-transparent"
                                }`}
                                data-testid={`received-item-${item.id}`}
                              >
                                <Avatar className="h-4 w-4 shrink-0">
                                  <AvatarImage src={item.profileImageUrl || ""} />
                                  <AvatarFallback className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px]">
                                    {(item.userName || "?")[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{item.userName || "未知用户"}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      <div className="flex-1 flex flex-col p-4 md:p-6">
        <div className="mb-4 md:mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
              <div className="h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              每日工作 AI 总结
            </h1>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">一键生成结构化工作日报，发送给领导审阅</p>
          </div>
          {viewMode === "my" && (
            <Button
              onClick={() => {
                setSelectedHistoryId(null);
                setSelectedReceivedId(null);
                setTeamSummaryDate(null);
                setSummaryContent("");
                generateMutation.mutate();
              }}
              disabled={generateMutation.isPending}
              className="glow-btn text-white border-0 h-9 px-5"
              data-testid="button-generate-summary"
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {generateMutation.isPending ? "生成中..." : "一键生成日报"}
            </Button>
          )}
        </div>

        <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col">
          <div className="glass-dialog-header px-4 md:px-6 py-3 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {headerTitle.icon}
              <span className={`text-sm font-medium truncate ${headerTitle.color}`}>
                {headerTitle.text}
              </span>
            </div>

            {summaryContent && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopy}
                  className="h-7 px-2 rounded-md text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/15 transition-all flex items-center gap-1"
                  data-testid="button-copy-summary"
                >
                  {copied ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? "已复制" : "复制"}
                </button>
                <button
                  onClick={handleExport}
                  className="h-7 px-2 rounded-md text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/15 transition-all flex items-center gap-1"
                  data-testid="button-export-summary"
                >
                  <Download className="h-3 w-3" />
                  导出
                </button>
                {viewMode === "my" && !teamSummaryDate && (
                  <>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/50 mx-0.5" />
                    {isCurrentSent ? (
                      <span className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        已发送
                      </span>
                    ) : activeSummaryId && !generateMutation.isPending ? (
                      <button
                        onClick={() => activeSummaryId && sendMutation.mutate(activeSummaryId)}
                        disabled={sendMutation.isPending}
                        className="h-7 px-3 rounded-md text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1 disabled:opacity-50"
                        data-testid="button-send-summary"
                      >
                        {sendMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        发送给领导
                      </button>
                    ) : null}
                  </>
                )}
                {(selectedHistoryId || selectedReceivedId || teamSummaryDate) && (
                  <>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/50 mx-0.5" />
                    <button
                      onClick={() => {
                        setSelectedHistoryId(null);
                        setSelectedReceivedId(null);
                        setTeamSummaryDate(null);
                        setSummaryContent("");
                        setViewMode("my");
                      }}
                      className="h-7 px-2 rounded-md text-[11px] font-medium text-blue-500 dark:text-blue-400 hover:bg-blue-500/10 transition-all"
                      data-testid="button-return-today"
                    >
                      返回当天
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 p-6 min-h-0">
            {!summaryContent && !generateMutation.isPending && !isGeneratingTeam ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-20 w-20 rounded-full bg-blue-500/5 border border-blue-500/15 flex items-center justify-center mb-6">
                  <FileText className="h-10 w-10 text-blue-500/20" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-slate-600 dark:text-slate-300">点击生成您的工作日报</h3>
                <p className="mb-6 max-w-md text-sm text-slate-400 dark:text-slate-500">
                  AI 将自动读取您今天的已完成任务、情报浏览记录和知识库交互，生成一份结构化的工作总结
                </p>
                <Button
                  onClick={() => generateMutation.mutate()}
                  className="glow-btn text-white border-0"
                  data-testid="button-generate-summary-center"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  一键生成日报
                </Button>
              </div>
            ) : (generateMutation.isPending || isGeneratingTeam) && !summaryContent ? (
              <div className="space-y-6 py-8">
                <div className="flex items-center gap-3 text-sm text-blue-500/70 dark:text-blue-300/70">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  {isGeneratingTeam ? "正在汇总团队日报，生成 AI 分析..." : "正在读取您的工作数据并生成日报..."}
                </div>
                <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full w-1/3 progress-glow" />
                </div>
                <div className="space-y-3">
                  {[0.75, 0.5, 0.65, 0.8, 0.35].map((w, i) => (
                    <div key={i} className="h-4 rounded glass-card animate-pulse" style={{ width: `${w * 100}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-1 prose prose-sm dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-blue-200 prose-h1:text-xl prose-h1:border-b prose-h1:border-blue-500/20 prose-h1:pb-2 prose-h2:text-base prose-h2:text-blue-600 dark:prose-h2:text-blue-300 prose-h3:text-sm prose-strong:text-slate-700 dark:prose-strong:text-blue-200 prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-hr:border-blue-500/15 leading-relaxed" data-testid="text-summary-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryContent}</ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="glass-dialog border-blue-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-700 dark:text-blue-200">确认删除日报</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">此操作将永久删除该日报记录，且无法恢复。确定要继续吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-400 border-blue-500/15 hover:bg-blue-500/10">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              data-testid="button-confirm-delete-summary"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
