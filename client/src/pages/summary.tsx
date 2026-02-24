import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function SummaryPage() {
  const { toast } = useToast();
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
    const blob = new Blob([summaryContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `销售日报_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "导出成功" });
  };

  return (
    <div className="flex h-full flex-col p-4" data-testid="page-summary">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <FileText className="h-5 w-5 text-primary" />
            每日工作 AI 总结
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            一键生成结构化销售日报
          </p>
        </div>
        <div className="flex gap-2">
          {summaryContent && (
            <>
              <Button
                variant="secondary"
                onClick={handleCopy}
                data-testid="button-copy-summary"
              >
                {copied ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "已复制" : "复制"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleExport}
                data-testid="button-export-summary"
              >
                <Download className="mr-2 h-4 w-4" />
                导出
              </Button>
            </>
          )}
          <Button
            onClick={() => {
              setSummaryContent("");
              generateMutation.mutate();
            }}
            disabled={generateMutation.isPending}
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

      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            销售日报 - {new Date().toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {!summaryContent && !generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <FileText className="mb-4 h-16 w-16 opacity-20" />
              <h3 className="mb-2 text-lg font-medium">点击生成您的销售日报</h3>
              <p className="mb-6 max-w-md text-sm">
                AI 将自动读取您今天的已完成任务、情报浏览记录和知识库交互，
                生成一份结构化的工作总结
              </p>
              <Button
                onClick={() => generateMutation.mutate()}
                data-testid="button-generate-summary-center"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                一键生成日报
              </Button>
            </div>
          ) : generateMutation.isPending && !summaryContent ? (
            <div className="space-y-4 py-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在读取您的工作数据并生成日报...
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap" data-testid="text-summary-content">
                {summaryContent}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
