import { useState } from "react";
import { Receipt, Plus, Clock, CheckCircle2, XCircle, ChevronRight, ArrowLeft, FileText, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface ExpenseItem {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  approver: string;
  description: string;
}

const mockExpenses: ExpenseItem[] = [
  { id: 1, title: "客户拜访-小鹏汽车差旅费", amount: 3250, category: "差旅", date: "2026-02-24", status: "approved", approver: "李总", description: "深圳-广州往返高铁+酒店2晚+餐费" },
  { id: 2, title: "宁德时代技术交流会议餐费", amount: 680, category: "招待", date: "2026-02-23", status: "pending", approver: "张经理", description: "商务午宴4人" },
  { id: 3, title: "行业展会参观交通费", amount: 450, category: "差旅", date: "2026-02-20", status: "approved", approver: "李总", description: "上海新能源展往返交通" },
  { id: 4, title: "办公耗材采购", amount: 186, category: "办公", date: "2026-02-18", status: "rejected", approver: "张经理", description: "打印纸、文件夹等" },
  { id: 5, title: "客户招待-比亚迪项目组晚宴", amount: 1560, category: "招待", date: "2026-02-15", status: "approved", approver: "李总", description: "项目庆功宴6人" },
];

const statusConfig = {
  pending: { label: "审批中", icon: Clock, className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved: { label: "已通过", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "已驳回", icon: XCircle, className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function PluginExpensePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filtered = filter === "all" ? mockExpenses : mockExpenses.filter(e => e.status === filter);
  const totalPending = mockExpenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const totalApproved = mockExpenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-plugin-expense">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-emerald-400" />
            </div>
            内部报销审批
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">管理差旅与业务报销申请</p>
        </div>
        <Button className="glow-btn text-white border-0 gap-2" data-testid="button-new-expense">
          <Plus className="h-4 w-4" />
          新建报销
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">待审批金额</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400">¥{totalPending.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-1">{mockExpenses.filter(e => e.status === "pending").length} 笔待审</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">本月已报销</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400">¥{totalApproved.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-1">{mockExpenses.filter(e => e.status === "approved").length} 笔通过</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">累计报销</span>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-blue-400">¥{mockExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-1">共 {mockExpenses.length} 笔记录</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "glow-btn text-white border-0 h-7 text-xs" : "h-7 text-xs border-blue-500/15 text-slate-400 hover:text-blue-300 hover:bg-blue-500/5"}
            data-testid={`filter-expense-${f}`}
          >
            {f === "all" ? "全部" : statusConfig[f].label}
          </Button>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-10 w-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">暂无报销记录</p>
          </div>
        ) : (
          <div className="divide-y divide-blue-500/5">
            {filtered.map(expense => {
              const sc = statusConfig[expense.status];
              const StatusIcon = sc.icon;
              return (
                <div key={expense.id} className="flex items-center gap-4 px-5 py-4 hover:bg-blue-500/5 transition-colors group cursor-pointer" data-testid={`expense-row-${expense.id}`}>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Receipt className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{expense.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {expense.date}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        审批人: {expense.approver}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4 bg-blue-500/5 text-blue-400/70 border-blue-500/10">
                        {expense.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">¥{expense.amount.toLocaleString()}</p>
                    <Badge variant="outline" className={`text-[9px] h-4 mt-1 ${sc.className}`}>
                      <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                      {sc.label}
                    </Badge>
                  </div>
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
