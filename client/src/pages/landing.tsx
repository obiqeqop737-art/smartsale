import { Button } from "@/components/ui/button";
import { Brain, Radar, KanbanSquare, FileText, ArrowRight, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "专属知识库",
    desc: "上传合同、报价单和客户记录，AI 精准回答销售问题，告别信息断层",
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
    title: "每日总结",
    desc: "一键生成结构化销售日报，自动汇总当日工作成果",
  },
  {
    icon: Shield,
    title: "数据隔离",
    desc: "每个销售账号拥有完全独立的知识库，确保数据安全",
  },
  {
    icon: Zap,
    title: "Gemini 驱动",
    desc: "基于 Gemini 3.1 大模型，RAG 架构确保回答精准可靠",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Sales AI Agent</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">
              登录 / 注册
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </nav>

      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-chart-2/5 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              企业级销售
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                {" "}AI 智能体
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              融合 RAG 检索增强生成与 Gemini 大模型，为每位销售构建专属 AI 助手。
              彻底解决离职交接、客户信息断层和情报滞后等核心痛点。
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">
                  立即开始
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>免费使用 · 无需信用卡</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl">核心功能</h2>
          <p className="mb-12 text-center text-muted-foreground">六大模块，全方位赋能销售团队</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="hover-elevate group transition-all duration-200">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sales AI Agent. Built with Gemini 3.1 on Replit.
        </div>
      </footer>
    </div>
  );
}
