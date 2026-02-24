import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
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
  ChevronRight,
} from "lucide-react";
import type { DailySummary } from "@shared/schema";

export default function SummaryPage() {
  const { toast } = useToast();
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  const { data: historyList = [] } = useQuery<DailySummary[]>({
    queryKey: ["/api/daily-summaries"],
  });

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
    setSummaryContent(item.content);
  };

  const formatHistoryDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  };

  const formatHistoryDay = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("zh-CN", { weekday: "short" });
  };

  return (
    <div className="flex h-full" data-testid="page-summary">
      {showHistory && (
        <div className="w-64 shrink-0 border-r border-blue-500/10 flex-col bg-slate-50/50 dark:bg-slate-950/30 hidden md:flex" data-testid="summary-history-sidebar">
          <div className="px-4 py-3 border-b border-blue-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-200">历史日报</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-600">{historyList.length} 份</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {historyList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="h-8 w-8 text-blue-500/15 mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-600">暂无历史日报</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-700 mt-1">生成日报后将保存在此处</p>
                </div>
              ) : (
                historyList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectHistory(item)}
                    className={`w-full text-left rounded-lg p-3 transition-all ${
                      selectedHistoryId === item.id
                        ? "bg-blue-500/10 border border-blue-500/20 glow-border-active"
                        : "hover:bg-blue-500/5 border border-transparent"
                    }`}
                    data-testid={`history-item-${item.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{formatHistoryDate(item.date)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-600">{formatHistoryDay(item.date)}</span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 pl-5">
                      {item.content.slice(0, 80)}...
                    </p>
                  </button>
                ))
              )}
            </div>
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
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">一键生成结构化工作日报</p>
          </div>
          <div className="flex gap-2">
            {summaryContent && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 border border-blue-500/15"
                  data-testid="button-copy-summary"
                >
                  {copied ? <CheckCircle className="mr-2 h-4 w-4 text-emerald-400" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "已复制" : "复制"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleExport}
                  className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 border border-blue-500/15"
                  data-testid="button-export-summary"
                >
                  <Download className="mr-2 h-4 w-4" />
                  导出
                </Button>
              </>
            )}
            <Button
              onClick={() => {
                setSelectedHistoryId(null);
                setSummaryContent("");
                generateMutation.mutate();
              }}
              disabled={generateMutation.isPending}
              className="glow-btn text-white border-0"
              data-testid="button-generate-summary"
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {generateMutation.isPending ? "生成中..." : "一键生成日报"}
            </Button>
          </div>
        </div>

        <div className="flex-1 glass-card rounded-xl overflow-hidden">
          <div className="glass-dialog-header px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                {selectedHistoryId
                  ? `历史日报 - ${historyList.find(h => h.id === selectedHistoryId)?.date || ""}`
                  : `工作日报 - ${new Date().toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}`
                }
              </span>
            </div>
            {selectedHistoryId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedHistoryId(null); setSummaryContent(""); }}
                className="text-xs text-blue-400 hover:text-blue-300 h-6 px-2"
                data-testid="button-return-today"
              >
                返回当天
              </Button>
            )}
          </div>

          <div className="p-6 h-[calc(100%-48px)]">
            {!summaryContent && !generateMutation.isPending ? (
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
            ) : generateMutation.isPending && !summaryContent ? (
              <div className="space-y-6 py-8">
                <div className="flex items-center gap-3 text-sm text-blue-500/70 dark:text-blue-300/70">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  正在读取您的工作数据并生成日报...
                </div>
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
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
    </div>
  );
}
