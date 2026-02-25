import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Radar, TrendingUp, Building2, Link2, Sparkles, ExternalLink, Star, Share2, Search, X, Flame, Clock, RefreshCw, Loader2, Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { IntelligencePost } from "@shared/schema";
import type { User } from "@shared/models/auth";

const categoryConfig: Record<string, { icon: typeof Radar; color: string; label: string; bgClass: string; activeBg: string }> = {
  industry: { icon: TrendingUp, color: "text-blue-600 dark:text-blue-400", label: "行业动态", bgClass: "bg-blue-100 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20", activeBg: "bg-blue-200 border-blue-300 dark:bg-blue-500/25 dark:border-blue-500/40" },
  competitor: { icon: Building2, color: "text-purple-600 dark:text-purple-400", label: "友商追踪", bgClass: "bg-purple-100 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20", activeBg: "bg-purple-200 border-purple-300 dark:bg-purple-500/25 dark:border-purple-500/40" },
  supply_chain: { icon: Link2, color: "text-emerald-600 dark:text-emerald-400", label: "供应链", bgClass: "bg-emerald-100 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20", activeBg: "bg-emerald-200 border-emerald-300 dark:bg-emerald-500/25 dark:border-emerald-500/40" },
};

export default function IntelligencePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<IntelligencePost | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sharePost, setSharePost] = useState<IntelligencePost | null>(null);
  const [shareSearch, setShareSearch] = useState("");
  const [sharedTo, setSharedTo] = useState<Set<string>>(new Set());

  const { data: posts = [], isLoading } = useQuery<IntelligencePost[]>({
    queryKey: ["/api/intelligence-posts"],
  });

  const { data: favorites = [] } = useQuery<number[]>({
    queryKey: ["/api/intelligence-posts/favorites"],
  });

  const { data: schedulerStatus } = useQuery<{
    running: boolean;
    nextUpdateAt: string;
    lastGeneratedAt: string | null;
    schedule: string;
  }>({
    queryKey: ["/api/intelligence-scheduler/status"],
    refetchInterval: 60000,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/intelligence-posts/${id}/favorite`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/intelligence-posts/favorites"] });
      toast({ title: data.isFavorite ? "已加入收藏" : "已取消收藏" });
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async (clearOld?: boolean) => {
      const res = await apiRequest("POST", "/api/intelligence-scheduler/trigger", { clearOld: !!clearOld });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/intelligence-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intelligence-scheduler/status"] });
      toast({ title: data.message || "情报更新成功" });
    },
    onError: (err: Error) => {
      toast({ title: "更新失败", description: err.message, variant: "destructive" });
    },
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!sharePost,
  });

  const shareableUsers = useMemo(() => {
    const filtered = allUsers.filter(u => u.id !== user?.id);
    if (!shareSearch.trim()) return filtered;
    const q = shareSearch.toLowerCase();
    return filtered.filter(u =>
      (u.firstName || "").toLowerCase().includes(q) ||
      (u.lastName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  }, [allUsers, user, shareSearch]);

  const shareMutation = useMutation({
    mutationFn: async ({ postId, targetUserId }: { postId: number; targetUserId: string }) => {
      await apiRequest("POST", `/api/intelligence-posts/${postId}/share`, { targetUserId });
    },
    onSuccess: (_, vars) => {
      setSharedTo(prev => new Set(prev).add(vars.targetUserId));
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: () => {
      toast({ title: "分享失败", variant: "destructive" });
    },
  });

  const trackViewMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/intelligence-posts/${id}/view`);
    },
  });

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (showFavoritesOnly) {
      result = result.filter(p => favorites.includes(p.id));
    }
    if (activeCategory) {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [posts, favorites, activeCategory, searchQuery, showFavoritesOnly]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return counts;
  }, [posts]);

  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "刚刚";
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const handleCardClick = (post: IntelligencePost) => {
    setSelectedPost(post);
    trackViewMutation.mutate(post.id);
  };

  return (
    <div className="flex h-full flex-col p-4 md:p-6" data-testid="page-intelligence">
      <div className="mb-3 md:mb-6 flex flex-col gap-2 md:gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Radar className="h-4 w-4 text-blue-400" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white truncate">情报雷达</h1>
            {schedulerStatus && (
              <div className="hidden md:flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 cursor-default shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">{schedulerStatus.schedule}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {schedulerStatus && (
              <div className="flex md:hidden items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">{schedulerStatus.schedule}</span>
              </div>
            )}
            {user?.role === "admin" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg border border-blue-500/15 text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10"
                onClick={() => triggerMutation.mutate(true)}
                disabled={triggerMutation.isPending}
                data-testid="button-trigger-intel-update"
              >
                {triggerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        <p className="hidden md:block text-sm text-slate-400 dark:text-slate-500">锂电池及新能源行业实时情报追踪</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索情报标题、摘要、标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-lg text-sm glass-input text-slate-600 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
            data-testid="input-intel-search"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" data-testid="button-clear-search">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:flex-wrap md:overflow-visible md:pb-0">
        <button
          onClick={() => { setActiveCategory(null); setShowFavoritesOnly(false); }}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-all ${
            !activeCategory && !showFavoritesOnly
              ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/40 dark:text-blue-300"
              : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-700 hover:border-slate-300 dark:bg-slate-800/30 dark:border-slate-700/30 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:border-slate-600/40"
          }`}
          data-testid="filter-all"
        >
          全部
          <span className="ml-1 text-[10px] opacity-70">{posts.length}</span>
        </button>
        <button
          onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setActiveCategory(null); }}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-all ${
            showFavoritesOnly
              ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300"
              : "bg-slate-100 border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300 dark:bg-slate-800/30 dark:border-slate-700/30 dark:text-slate-500 dark:hover:text-amber-300 dark:hover:border-amber-600/40"
          }`}
          data-testid="filter-favorites"
        >
          <Star className={`h-3 w-3 ${showFavoritesOnly ? "fill-amber-500 dark:fill-amber-300" : ""}`} />
          我的收藏
          <span className="ml-1 text-[10px] opacity-70">{favorites.length}</span>
        </button>
        {Object.entries(categoryConfig).map(([key, cfg]) => {
          const isActive = activeCategory === key;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(isActive ? null : key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-all ${
                isActive ? cfg.activeBg : `${cfg.bgClass} hover:opacity-80`
              }`}
              data-testid={`filter-${key}`}
            >
              <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
              <span className={cfg.color}>{cfg.label}</span>
              <span className={`ml-1 text-[10px] ${cfg.color} opacity-70`}>{categoryCounts[key] || 0}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="columns-1 gap-3 md:gap-4 sm:columns-2 lg:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-3 md:mb-4 break-inside-avoid">
              <div className="h-48 rounded-xl glass-card animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center py-16">
          <Radar className="mb-4 h-16 w-16 text-blue-500/15" />
          <h3 className="mb-2 text-lg font-medium text-slate-500 dark:text-slate-400">
            {searchQuery || activeCategory ? "未找到匹配的情报" : "暂无情报"}
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-600">
            {searchQuery || activeCategory ? "请尝试调整筛选条件" : "情报数据正在加载中..."}
          </p>
          {(searchQuery || activeCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
              className="mt-3 text-blue-400 hover:text-blue-300"
              data-testid="button-clear-filters"
            >
              清除筛选
            </Button>
          )}
        </div>
      ) : (
        <div className="columns-1 gap-3 md:gap-4 sm:columns-2 lg:columns-3">
          {filteredPosts.map((post, idx) => {
            const cfg = categoryConfig[post.category] || categoryConfig.industry;
            const Icon = cfg.icon;
            const isFavorite = favorites.includes(post.id);
            return (
              <div key={post.id} className="mb-3 md:mb-4 break-inside-avoid">
                <div
                  className="glass-card glass-card-hover rounded-xl p-3 md:p-5 cursor-pointer transition-all duration-300 relative"
                  data-testid={`intel-card-${post.id}`}
                  onClick={() => handleCardClick(post)}
                >
                  <div className="absolute top-3 right-3 flex gap-2">
                    {idx === 0 && !activeCategory && !searchQuery && !showFavoritesOnly && (
                      <div className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] text-red-400">
                        <Flame className="h-2.5 w-2.5" />
                        热门
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteMutation.mutate(post.id);
                      }}
                      className={`p-1 rounded-full transition-colors ${
                        isFavorite ? "text-amber-400" : "text-slate-500 hover:text-amber-400"
                      }`}
                    >
                      <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-400" : ""}`} />
                    </button>
                  </div>
                  <div className="mb-3 flex items-center justify-between gap-2 pr-16">
                    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] ${cfg.bgClass}`}>
                      <Icon className={`h-2.5 w-2.5 ${cfg.color}`} />
                      <span className={cfg.color}>{cfg.label}</span>
                    </div>
                  </div>
                  <h3 className="mb-2 text-[13px] md:text-sm font-semibold leading-snug text-slate-800 dark:text-white">{post.title}</h3>
                  <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">{post.summary}</p>
                  <div className="flex items-start gap-2 rounded-lg bg-blue-500/5 border border-blue-500/10 p-2 md:p-3">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-blue-400 animate-glow-pulse" />
                    <p className="text-xs font-medium leading-relaxed text-blue-600 dark:text-blue-300 line-clamp-2">{post.aiInsight}</p>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-blue-500/8 border border-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-500/70 dark:text-blue-300/70">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-1 text-[10px] text-slate-400 dark:text-slate-600">
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-2.5 w-2.5" />
                      来源: {post.source}
                    </div>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={selectedPost !== null} onOpenChange={(open) => !open && setSelectedPost(null)}>
        {selectedPost && (
          <DialogContent className="glass-dialog border-blue-500/20 w-[95vw] h-[90vh] sm:w-auto sm:h-auto sm:max-w-2xl sm:max-h-[80vh] overflow-auto">
            <DialogHeader className="glass-dialog-header -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-blue-700 dark:text-blue-200 pr-8">{selectedPost.title}</DialogTitle>
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
                <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(selectedPost.publishedAt)}</span>
                <span className="text-xs text-slate-400 dark:text-slate-600">来源: {selectedPost.source}</span>
              </div>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">情报摘要</h4>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{selectedPost.summary}</p>
              </div>
              {selectedPost.aiInsight && (
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/15 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <h4 className="text-xs font-medium text-blue-600 dark:text-blue-300">AI 商业洞察</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-blue-700/80 dark:text-blue-200/80">{selectedPost.aiInsight}</p>
                </div>
              )}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">标签</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPost.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 text-xs text-blue-500/70 dark:text-blue-300/70">
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
                  className={`${favorites.includes(selectedPost.id) ? "text-amber-400 hover:text-amber-500" : "text-slate-400 hover:text-blue-400"} hover:bg-blue-500/10`}
                  onClick={() => toggleFavoriteMutation.mutate(selectedPost.id)}
                  data-testid="button-favorite-intel"
                >
                  <Star className={`mr-1.5 h-3.5 w-3.5 ${favorites.includes(selectedPost.id) ? "fill-amber-400" : ""}`} />
                  {favorites.includes(selectedPost.id) ? "已收藏" : "收藏"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                  onClick={() => {
                    setSharePost(selectedPost);
                    setSharedTo(new Set());
                    setShareSearch("");
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

      <Dialog open={!!sharePost} onOpenChange={(open) => { if (!open) setSharePost(null); }}>
        {sharePost && (
          <DialogContent className="glass-dialog border-blue-500/20 !w-[90vw] !max-w-[360px] overflow-hidden" data-testid="dialog-share-intel">
            <DialogHeader>
              <DialogTitle className="text-sm font-medium text-blue-700 dark:text-blue-200 flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                分享情报
              </DialogTitle>
            </DialogHeader>
            <div className="mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">「{sharePost.title}」</p>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索用户..."
                value={shareSearch}
                onChange={e => setShareSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg text-xs glass-input text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                data-testid="input-share-search"
              />
            </div>
            <ScrollArea className="max-h-[260px]">
              <div className="space-y-1">
                {shareableUsers.length > 0 ? shareableUsers.map(u => {
                  const alreadyShared = sharedTo.has(u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-blue-500/5 transition-colors"
                      data-testid={`share-user-${u.id}`}
                    >
                      <Avatar className="h-7 w-7 border border-blue-500/15">
                        <AvatarImage src={u.profileImageUrl || ""} />
                        <AvatarFallback className="bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[10px]">
                          {(u.firstName || "U")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                          {[u.firstName, u.lastName].filter(Boolean).join("") || u.email}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={alreadyShared || shareMutation.isPending}
                        onClick={() => shareMutation.mutate({ postId: sharePost.id, targetUserId: u.id })}
                        className={`h-7 px-2.5 text-[11px] shrink-0 ${
                          alreadyShared
                            ? "text-emerald-500 dark:text-emerald-400 cursor-default"
                            : "text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        }`}
                        data-testid={`button-share-to-${u.id}`}
                      >
                        {alreadyShared ? (
                          <><Check className="h-3 w-3 mr-1" />已分享</>
                        ) : (
                          <><Send className="h-3 w-3 mr-1" />分享</>
                        )}
                      </Button>
                    </div>
                  );
                }) : (
                  <p className="text-xs text-center text-slate-400 dark:text-slate-600 py-8">暂无可分享的用户</p>
                )}
              </div>
            </ScrollArea>
            {sharedTo.size > 0 && (
              <p className="text-[11px] text-emerald-500 dark:text-emerald-400 mt-2 text-center">
                已成功分享给 {sharedTo.size} 位用户
              </p>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
