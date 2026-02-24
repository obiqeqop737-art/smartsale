import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Radar, TrendingUp, Building2, Link2, Lightbulb, Sparkles } from "lucide-react";
import type { IntelligencePost } from "@shared/schema";

const categoryConfig: Record<string, { icon: typeof Radar; color: string; label: string }> = {
  industry: { icon: TrendingUp, color: "text-chart-1", label: "行业动态" },
  competitor: { icon: Building2, color: "text-chart-5", label: "友商追踪" },
  supply_chain: { icon: Link2, color: "text-chart-3", label: "供应链" },
};

export default function IntelligencePage() {
  const { data: posts = [], isLoading } = useQuery<IntelligencePost[]>({
    queryKey: ["/api/intelligence-posts"],
  });

  const trackViewMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/intelligence-posts/${id}/view`);
    },
  });

  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-full flex-col p-4" data-testid="page-intelligence">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Radar className="h-5 w-5 text-primary" />
            情报雷达
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            锂电池及新能源行业实时情报追踪
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <Badge key={key} variant="secondary" className="gap-1">
              <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
              {cfg.label}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
          <Radar className="mb-4 h-16 w-16 opacity-20" />
          <h3 className="mb-2 text-lg font-medium">暂无情报</h3>
          <p className="text-sm">情报数据正在加载中...</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {posts.map((post) => {
            const cfg = categoryConfig[post.category] || categoryConfig.industry;
            const Icon = cfg.icon;
            return (
              <div key={post.id} className="mb-4 break-inside-avoid">
                <Card
                  className="hover-elevate transition-all duration-200 cursor-pointer"
                  data-testid={`intel-card-${post.id}`}
                  onClick={() => trackViewMutation.mutate(post.id)}
                >
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Icon className={`h-3 w-3 ${cfg.color}`} />
                        {cfg.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                    <h3 className="mb-2 text-sm font-semibold leading-snug">{post.title}</h3>
                    <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{post.summary}</p>
                    <div className="flex items-start gap-2 rounded-md bg-primary/5 p-3">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      <p className="text-xs font-medium leading-relaxed text-primary">
                        {post.aiInsight}
                      </p>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Lightbulb className="h-2.5 w-2.5" />
                      来源: {post.source}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
