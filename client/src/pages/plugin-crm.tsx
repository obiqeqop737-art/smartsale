import { useState } from "react";
import { Shield, Search, Plus, Building2, Phone, Mail, MapPin, TrendingUp, Users, BarChart3, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: number;
  name: string;
  company: string;
  industry: string;
  level: "A" | "B" | "C";
  phone: string;
  email: string;
  region: string;
  dealAmount: number;
  lastContact: string;
  stage: "prospecting" | "negotiation" | "closed_won" | "closed_lost";
}

const mockCustomers: Customer[] = [
  { id: 1, name: "王建国", company: "小鹏汽车", industry: "新能源汽车", level: "A", phone: "138****5678", email: "wang@xpeng.com", region: "广州", dealAmount: 2800000, lastContact: "2026-02-24", stage: "negotiation" },
  { id: 2, name: "李明辉", company: "宁德时代", industry: "电池制造", level: "A", phone: "139****8901", email: "li@catl.com", region: "宁德", dealAmount: 5200000, lastContact: "2026-02-23", stage: "closed_won" },
  { id: 3, name: "张海燕", company: "比亚迪", industry: "新能源汽车", level: "B", phone: "136****2345", email: "zhang@byd.com", region: "深圳", dealAmount: 1500000, lastContact: "2026-02-22", stage: "prospecting" },
  { id: 4, name: "陈志远", company: "理想汽车", industry: "新能源汽车", level: "B", phone: "137****6789", email: "chen@lixiang.com", region: "北京", dealAmount: 960000, lastContact: "2026-02-20", stage: "negotiation" },
  { id: 5, name: "赵大伟", company: "中创新航", industry: "电池制造", level: "C", phone: "135****0123", email: "zhao@calb.com", region: "常州", dealAmount: 420000, lastContact: "2026-02-18", stage: "prospecting" },
  { id: 6, name: "刘芳", company: "亿纬锂能", industry: "电池制造", level: "B", phone: "133****4567", email: "liu@evebattery.com", region: "惠州", dealAmount: 1100000, lastContact: "2026-02-15", stage: "closed_won" },
];

const stageConfig = {
  prospecting: { label: "跟进中", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  negotiation: { label: "谈判中", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  closed_won: { label: "已成交", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  closed_lost: { label: "已流失", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const levelColors = {
  A: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  B: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  C: "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

export default function PluginCrmPage() {
  const [stageFilter, setStageFilter] = useState<"all" | Customer["stage"]>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockCustomers
    .filter(c => stageFilter === "all" || c.stage === stageFilter)
    .filter(c => !searchQuery || c.name.includes(searchQuery) || c.company.includes(searchQuery));

  const totalDeal = mockCustomers.filter(c => c.stage === "closed_won").reduce((s, c) => s + c.dealAmount, 0);
  const pipelineAmount = mockCustomers.filter(c => c.stage === "negotiation" || c.stage === "prospecting").reduce((s, c) => s + c.dealAmount, 0);

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-plugin-crm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
            CRM 客户管理
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">客户关系管理与销售漏斗追踪</p>
        </div>
        <Button className="glow-btn text-white border-0 gap-2" data-testid="button-new-customer">
          <Plus className="h-4 w-4" />
          新建客户
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">客户总数</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-blue-400">{mockCustomers.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">A级 {mockCustomers.filter(c => c.level === "A").length} / B级 {mockCustomers.filter(c => c.level === "B").length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">成交金额</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400">¥{(totalDeal / 10000).toFixed(0)}万</p>
          <p className="text-[10px] text-slate-500 mt-1">{mockCustomers.filter(c => c.stage === "closed_won").length} 笔成交</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">管线金额</span>
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400">¥{(pipelineAmount / 10000).toFixed(0)}万</p>
          <p className="text-[10px] text-slate-500 mt-1">{mockCustomers.filter(c => c.stage === "negotiation" || c.stage === "prospecting").length} 笔跟进中</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">转化率</span>
            <Star className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-purple-400">{Math.round((mockCustomers.filter(c => c.stage === "closed_won").length / mockCustomers.length) * 100)}%</p>
          <p className="text-[10px] text-slate-500 mt-1">成交/总客户</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            className="glass-input w-full h-8 pl-9 pr-3 text-sm rounded-lg"
            placeholder="搜索客户名称/公司..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            data-testid="input-search-customer"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "prospecting", "negotiation", "closed_won", "closed_lost"] as const).map(f => (
            <Button
              key={f}
              variant={stageFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setStageFilter(f)}
              className={stageFilter === f ? "glow-btn text-white border-0 h-7 text-xs" : "h-7 text-xs border-blue-500/15 text-slate-400 hover:text-blue-300 hover:bg-blue-500/5"}
              data-testid={`filter-crm-${f}`}
            >
              {f === "all" ? "全部" : stageConfig[f].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">未找到匹配的客户</p>
          </div>
        ) : (
          <div className="divide-y divide-blue-500/5">
            {filtered.map(customer => {
              const sc = stageConfig[customer.stage];
              return (
                <div key={customer.id} className="flex items-center gap-4 px-5 py-4 hover:bg-blue-500/5 transition-colors group cursor-pointer" data-testid={`customer-row-${customer.id}`}>
                  <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-400">{customer.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{customer.name}</p>
                      <Badge variant="outline" className={`text-[9px] h-4 ${levelColors[customer.level]}`}>
                        {customer.level}级
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Building2 className="h-2.5 w-2.5" />
                        {customer.company}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {customer.region}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5" />
                        {customer.phone}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">¥{(customer.dealAmount / 10000).toFixed(0)}万</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">最近联系 {customer.lastContact}</p>
                  </div>
                  <Badge variant="outline" className={`text-[9px] h-5 shrink-0 ${sc.className}`}>
                    {sc.label}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
