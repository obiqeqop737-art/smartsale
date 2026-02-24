import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Radar, TrendingUp, Building2, Link2, Sparkles, ExternalLink, Star, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IntelligencePost } from "@shared/schema";

const categoryConfig: Record<string, { icon: typeof Radar; color: string; label: string; bgClass: string }> = {
  industry: { icon: TrendingUp, color: "text-blue-400", label: "行业动态", bgClass: "bg-blue-500/10 border-blue-500/20" },
  competitor: { icon: Building2, color: "text-purple-400", label: "友商追踪", bgClass: "bg-purple-500/10 border-purple-500/20" },
  supply_chain: { icon: Link2, color: "text-emerald-400", label: "供应链", bgClass: "bg-emerald-500/10 border-emerald-500/20" },
};

export default function IntelligencePage() {
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<IntelligencePost | null>(null);

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

  const handleCardClick = (post: IntelligencePost) => {
    setSelectedPost(post);
    trackViewMutation.mutate(post.id);
  };

  return (
    <div className="flex h-full flex-col p-4 md:p-6" data-testid="page-intelligence">
      <div className="mb-4 md:mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Radar className="h-4 w-4 text-blue-400" />
            </div>
            情报雷达
          </h1>
          <p className="mt-1 text-sm text-slate-500">锂电池及新能源行业实时情报追踪</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <div key={key} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${cfg.bgClass}`}>
              <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
              <span className={cfg.color}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <div className="h-48 rounded-xl glass-card animate-pulse" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Radar className="mb-4 h-16 w-16 text-blue-500/15" />
          <h3 className="mb-2 text-lg font-medium text-slate-400">暂无情报</h3>
          <p className="text-sm text-slate-600">情报数据正在加载中...</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {posts.map((post) => {
            const cfg = categoryConfig[post.category] || categoryConfig.industry;
            const Icon = cfg.icon;
            return (
              <div key={post.id} className="mb-4 break-inside-avoid">
                <div
                  className="glass-card glass-card-hover rounded-xl p-5 cursor-pointer transition-all duration-300"
                  data-testid={`intel-card-${post.id}`}
                  onClick={() => handleCardClick(post)}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] ${cfg.bgClass}`}>
                      <Icon className={`h-2.5 w-2.5 ${cfg.color}`} />
                      <span className={cfg.color}>{cfg.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-600">{formatDate(post.publishedAt)}</span>
                  </div>
                  <h3 className="mb-2 text-sm font-semibold leading-snug text-white">{post.title}</h3>
                  <p className="mb-3 text-xs leading-relaxed text-slate-400">{post.summary}</p>
                  <div className="flex items-start gap-2 rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-blue-400 animate-glow-pulse" />
                    <p className="text-xs font-medium leading-relaxed text-blue-300">{post.aiInsight}</p>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-blue-500/8 border border-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-300/70">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-600">
                    <ExternalLink className="h-2.5 w-2.5" />
                    来源: {post.source}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={selectedPost !== null} onOpenChange={(open) => !open && setSelectedPost(null)}>
        {selectedPost && (
          <DialogContent className="glass-dialog border-blue-500/20 sm:max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader className="glass-dialog-header -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-blue-200 pr-8">{selectedPost.title}</DialogTitle>
              </div>
              <div className="flex items-center gap-3 mt-2">
                {(() => {
                  const cfg = categoryConfig[selectedPost.category] || categoryConfig.industry;
                  const Icon = cfg.icon;
                  return (
                    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${cfg.bgClass}`}>
                      <Icon className={`h-3 w-3 ${cfg.color}`} />
                      <span className={cfg.color}>{cfg.label}</span>
                    </div>
                  );
                })()}
                <span className="text-xs text-slate-500">{formatDate(selectedPost.publishedAt)}</span>
                <span className="text-xs text-slate-600">来源: {selectedPost.source}</span>
              </div>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-2">情报摘要</h4>
                <p className="text-sm leading-relaxed text-slate-300">{selectedPost.summary}</p>
              </div>
              {selectedPost.aiInsight && (
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/15 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <h4 className="text-xs font-medium text-blue-300">AI 商业洞察</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-blue-200/80">{selectedPost.aiInsight}</p>
                </div>
              )}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-2">标签</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPost.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 text-xs text-blue-300/70">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-blue-500/10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                  onClick={() => toast({ title: "已收藏" })}
                  data-testid="button-favorite-intel"
                >
                  <Star className="mr-1.5 h-3.5 w-3.5" />
                  收藏
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                  onClick={() => {
                    navigator.clipboard.writeText(`${selectedPost.title}\n${selectedPost.summary}`);
                    toast({ title: "已复制到剪贴板" });
                  }}
                  data-testid="button-share-intel"
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  分享
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
