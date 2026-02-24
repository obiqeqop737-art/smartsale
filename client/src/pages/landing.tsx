import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Brain, Radar, KanbanSquare, FileText, ArrowRight, Shield, Zap,
  FolderTree, Search, Sparkles, Upload, MessageSquare, BarChart3,
  Users, Globe, CheckCircle2, ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: FolderTree,
    title: "层级目录管理",
    desc: "三级目录导航体系，支持展开/折叠、智能分类，海量文档高效组织",
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
    desc: "可视化管理工作任务流程，支持拖拽操作和截止日期智能提醒",
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

const steps = [
  { num: "01", title: "上传文档", desc: "将合同、报价、客户记录等文件上传到三级目录体系中", icon: Upload },
  { num: "02", title: "AI 问答", desc: "基于您的知识库进行精准问答，获取深度业务洞察", icon: MessageSquare },
  { num: "03", title: "追踪管理", desc: "实时情报雷达 + 任务看板，全方位管理工作进度", icon: BarChart3 },
  { num: "04", title: "智能总结", desc: "一键生成结构化日报，自动汇总成果、规划明日任务", icon: Sparkles },
];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / 1500, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-white">
        {val.toLocaleString()}{suffix}
      </div>
    </div>
  );
}

const stats = [
  { value: 10000, suffix: "+", label: "文档处理量" },
  { value: 500, suffix: "+", label: "企业用户" },
  { value: 99.9, suffix: "%", label: "系统可用性" },
  { value: 50, suffix: "ms", label: "平均响应速度" },
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
              为每位用户构建专属 AI 知识助手。
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

      <section className="py-16 relative">
        <div className="mx-auto max-w-6xl px-6">
          <div className="glass-card rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                  <p className="mt-2 text-sm text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl text-white">核心功能</h2>
          <p className="mb-12 text-center text-slate-500">六大模块，全方位赋能企业团队</p>
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

      <section className="py-20 relative">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl text-white">使用流程</h2>
          <p className="mb-12 text-center text-slate-500">四步开启智能文档管理</p>
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={step.num} className="relative group">
                <div className="glass-card rounded-xl p-6 text-center transition-all duration-300 hover:border-blue-500/30">
                  <div className="text-4xl font-bold text-blue-500/10 mb-3">{step.num}</div>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:border-blue-500/40 transition-all">
                    <step.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-500">{step.desc}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-5 w-5 text-blue-500/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="mx-auto max-w-6xl px-6">
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-blue-400/10 to-blue-500/5" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                准备好提升您的工作效率了吗？
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                加入 DocuMind AI，让 AI 成为您的智能文档助手，轻松管理知识库、追踪行业情报、高效完成每日工作。
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild className="glow-btn text-white border-0 px-10">
                  <a href="/api/login">
                    免费开始使用
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500/50" />
                  <span>无需安装</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500/50" />
                  <span>数据加密</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500/50" />
                  <span>即刻可用</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-blue-500/10 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-500/40" />
            <span className="text-sm text-slate-600">DocuMind AI</span>
          </div>
          <div className="text-center text-xs text-slate-700">
            &copy; {new Date().getFullYear()} DocuMind AI. Built with Gemini 3.1 on Replit.
          </div>
          <div className="flex gap-4 text-xs text-slate-600">
            <span>隐私政策</span>
            <span>服务条款</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
