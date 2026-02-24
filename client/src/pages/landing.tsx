import { Button } from "@/components/ui/button";
import { Brain, Radar, KanbanSquare, FileText, ArrowRight, Shield, Zap, FolderTree, Search, Sparkles } from "lucide-react";

const features = [
  {
    icon: FolderTree,
    title: "层级目录管理",
    desc: "三级目录导航体系，支持展开/折叠、拖拽调整层级、智能分类",
  },
  {
    icon: Brain,
    title: "RAG 智能问答",
    desc: "基于个人知识库的精准问答，AI 深度理解合同、报价、客户记录",
  },
  {
    icon: Radar,
    title: "情报雷达",
    desc: "实时追踪行业动态、友商信息和供应链变化，AI 提炼商业价值",
  },
  {
    icon: KanbanSquare,
    title: "任务看板",
    desc: "可视化管理销售任务流程，支持拖拽操作和截止日期智能提醒",
  },
  {
    icon: FileText,
    title: "每日 AI 总结",
    desc: "一键生成结构化销售日报，自动汇总当日工作成果和明日计划",
  },
  {
    icon: Shield,
    title: "多用户数据隔离",
    desc: "每个账号拥有完全独立的知识库和数据空间，确保企业数据安全",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/4 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-400/3 blur-[180px]" />
      </div>

      <nav className="sticky top-0 z-50 glass-sidebar border-b border-blue-500/10 border-r-0 !bg-opacity-90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg glow-btn">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">DocuMind AI</span>
          </div>
          <Button asChild className="glow-btn text-white border-0" data-testid="button-login">
            <a href="/api/login">
              登录 / 注册
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </nav>

      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-blue-300/80">Powered by Gemini 3.1 · RAG Architecture</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-white">
              企业级智能
              <span className="glow-text"> 文档管理平台</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-400 sm:text-xl">
              融合 RAG 检索增强生成与 Gemini 大模型，三级目录层级管理，
              为每位销售构建专属 AI 知识助手。
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild className="glow-btn text-white border-0 px-8" data-testid="button-get-started">
                <a href="/api/login">
                  立即开始
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Shield className="h-4 w-4" />
                <span>免费使用 · 无需信用卡</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl text-white">核心功能</h2>
          <p className="mb-12 text-center text-slate-500">六大模块，全方位赋能销售团队</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="glass-card glass-card-hover rounded-xl p-6 transition-all duration-300 group">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 transition-all group-hover:border-blue-500/40 group-hover:shadow-[0_0_15px_rgba(56,130,246,0.15)]">
                  <f.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-blue-500/10 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-600">
          &copy; {new Date().getFullYear()} DocuMind AI. Built with Gemini 3.1 on Replit.
        </div>
      </footer>
    </div>
  );
}
