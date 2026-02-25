import { useState, useRef, useEffect } from "react";
import {
  Receipt, Plus, Clock, CheckCircle2, XCircle, ChevronRight, FileText, User, Calendar,
  Sparkles, Send, Plane, X, MapPin, Building2, CreditCard, Loader2, PenLine, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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

interface TravelForm {
  type: "travel";
  destination: string;
  purpose: string;
  departDate: string;
  returnDate: string;
  transport: string;
  estimatedCost: string;
  hotel: string;
  hotelBudget: string;
  mealBudget: string;
  otherCost: string;
  remarks: string;
  client: string;
  companions: string;
}

interface ReimbursementForm {
  type: "reimbursement";
  title: string;
  category: string;
  totalAmount: string;
  date: string;
  items: { name: string; amount: string; }[];
  invoiceCount: string;
  payee: string;
  bankAccount: string;
  relatedTravel: string;
  remarks: string;
  client: string;
}

type FormData = TravelForm | ReimbursementForm;

const emptyTravelForm: TravelForm = {
  type: "travel", destination: "", purpose: "", departDate: "", returnDate: "",
  transport: "", estimatedCost: "", hotel: "", hotelBudget: "", mealBudget: "",
  otherCost: "", remarks: "", client: "", companions: "",
};

const emptyReimbursementForm: ReimbursementForm = {
  type: "reimbursement", title: "", category: "", totalAmount: "", date: "",
  items: [{ name: "", amount: "" }], invoiceCount: "", payee: "", bankAccount: "",
  relatedTravel: "", remarks: "", client: "",
};

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

const aiExamples = [
  "下周一去宁德拜访宁德时代张总，高铁往返，住2晚",
  "报销上周去广州小鹏的差旅费，高铁票520，酒店两晚860，餐费230",
  "2月28号去上海参加储能展，飞机往返，预计3天",
  "报销本周招待比亚迪客户的晚宴费用1200元",
];

function simulateAIParse(input: string): FormData {
  const isReimbursement = input.includes("报销") || input.includes("发票") || input.includes("费用");
  const today = new Date().toISOString().split("T")[0];

  const amountMatch = input.match(/(\d+(?:\.\d+)?)\s*元/);
  const cityMatch = input.match(/(?:去|到|飞|赴)([^\s,，、去到飞赴的]+?)(?:拜访|出差|参加|开会|参观|的|，|,|\s)/);
  const clientMatch = input.match(/(?:拜访|见|会见|招待)([^\s,，、的]+?)(?:的|，|,|\s|$)/);
  const daysMatch = input.match(/(\d+)\s*(?:天|晚|夜)/);
  const transportMatch = input.match(/(高铁|飞机|动车|火车|自驾|大巴)/);
  const hotelMatch = input.match(/(?:酒店|住宿)(?:.*?)(\d+)/);
  const trainMatch = input.match(/(?:高铁|车票|火车票)(?:.*?)(\d+)/);
  const mealMatch = input.match(/(?:餐费|餐饮|饭费)(?:.*?)(\d+)/);
  const dateMatch = input.match(/(\d{1,2})月(\d{1,2})(?:号|日)/);

  if (isReimbursement) {
    const items: { name: string; amount: string }[] = [];
    if (trainMatch) items.push({ name: "交通费（高铁/火车）", amount: trainMatch[1] });
    if (hotelMatch) items.push({ name: "住宿费", amount: hotelMatch[1] });
    if (mealMatch) items.push({ name: "餐饮费", amount: mealMatch[1] });
    if (amountMatch && items.length === 0) items.push({ name: "费用明细", amount: amountMatch[1] });
    if (items.length === 0) items.push({ name: "", amount: "" });

    const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

    return {
      type: "reimbursement",
      title: clientMatch
        ? `${clientMatch[1]}${cityMatch ? `(${cityMatch[1]})` : ""}相关费用报销`
        : cityMatch ? `${cityMatch[1]}出差费用报销` : "业务费用报销",
      category: input.includes("招待") || input.includes("晚宴") || input.includes("午宴") ? "业务招待" : "差旅报销",
      totalAmount: total > 0 ? total.toString() : amountMatch ? amountMatch[1] : "",
      date: today,
      items,
      invoiceCount: items.filter(i => i.amount).length.toString(),
      payee: "",
      bankAccount: "",
      relatedTravel: cityMatch ? `${cityMatch[1]}出差` : "",
      remarks: input,
      client: clientMatch ? clientMatch[1] : "",
    };
  }

  let departDate = "";
  let returnDate = "";
  if (dateMatch) {
    const year = new Date().getFullYear();
    departDate = `${year}-${dateMatch[1].padStart(2, "0")}-${dateMatch[2].padStart(2, "0")}`;
    if (daysMatch) {
      const d = new Date(departDate);
      d.setDate(d.getDate() + parseInt(daysMatch[1]));
      returnDate = d.toISOString().split("T")[0];
    }
  } else if (input.includes("下周一")) {
    const d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    departDate = d.toISOString().split("T")[0];
    if (daysMatch) {
      const r = new Date(d);
      r.setDate(r.getDate() + parseInt(daysMatch[1]));
      returnDate = r.toISOString().split("T")[0];
    }
  } else if (input.includes("明天")) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    departDate = d.toISOString().split("T")[0];
  }

  if (daysMatch && departDate && !returnDate) {
    const d = new Date(departDate);
    d.setDate(d.getDate() + parseInt(daysMatch[1]));
    returnDate = d.toISOString().split("T")[0];
  }

  return {
    type: "travel",
    destination: cityMatch ? cityMatch[1] : "",
    purpose: clientMatch ? `拜访客户${clientMatch[1]}` : input.includes("展") ? "参加行业展会" : input.includes("会议") ? "商务会议" : "客户拜访",
    departDate,
    returnDate,
    transport: transportMatch ? transportMatch[1] : "",
    estimatedCost: "",
    hotel: daysMatch ? `预计住${daysMatch[1]}晚` : "",
    hotelBudget: daysMatch ? (parseInt(daysMatch[1]) * 400).toString() : "",
    mealBudget: daysMatch ? (parseInt(daysMatch[1]) * 100).toString() : "",
    otherCost: "",
    remarks: input,
    client: clientMatch ? clientMatch[1] : "",
    companions: "",
  };
}

function FormField({ label, value, onChange, placeholder, icon: Icon, highlight, type = "text", readonly = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  icon?: typeof Receipt; highlight?: boolean; type?: string; readonly?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readonly}
        className={`glass-input w-full h-9 px-3 text-sm rounded-lg transition-all duration-500 ${
          highlight ? "ring-1 ring-emerald-500/40 bg-emerald-500/5" : ""
        }`}
        data-testid={`input-${label}`}
      />
    </div>
  );
}

export default function PluginExpensePage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [showForm, setShowForm] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [filledFields, setFilledFields] = useState<Set<string>>(new Set());
  const [formType, setFormType] = useState<"travel" | "reimbursement">("travel");
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  const filtered = filter === "all" ? mockExpenses : mockExpenses.filter(e => e.status === filter);
  const totalPending = mockExpenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const totalApproved = mockExpenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0);

  const handleAIParse = async () => {
    if (!aiInput.trim()) return;
    setAiParsing(true);
    setFilledFields(new Set());

    await new Promise(r => setTimeout(r, 1200));

    const parsed = simulateAIParse(aiInput);
    setFormData(parsed);
    setFormType(parsed.type);

    const filled = new Set<string>();
    for (const [key, val] of Object.entries(parsed)) {
      if (key === "type" || key === "items") continue;
      if (typeof val === "string" && val.trim()) filled.add(key);
    }
    setFilledFields(filled);
    setAiParsing(false);

    toast({
      title: "AI 智能填单完成",
      description: `已识别 ${filled.size} 个字段，请检查并补充剩余信息`,
    });

    setTimeout(() => setFilledFields(new Set()), 3000);
  };

  const updateTravelField = (field: keyof TravelForm, value: string) => {
    setFormData(prev => prev && prev.type === "travel" ? { ...prev, [field]: value } : prev);
  };

  const updateReimbursementField = (field: keyof ReimbursementForm, value: string) => {
    setFormData(prev => prev && prev.type === "reimbursement" ? { ...prev, [field]: value } : prev);
  };

  const updateReimbursementItem = (index: number, field: "name" | "amount", value: string) => {
    setFormData(prev => {
      if (!prev || prev.type !== "reimbursement") return prev;
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addReimbursementItem = () => {
    setFormData(prev => {
      if (!prev || prev.type !== "reimbursement") return prev;
      return { ...prev, items: [...prev.items, { name: "", amount: "" }] };
    });
  };

  const removeReimbursementItem = (index: number) => {
    setFormData(prev => {
      if (!prev || prev.type !== "reimbursement" || prev.items.length <= 1) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  };

  const handleSubmit = () => {
    toast({ title: "提交成功", description: "您的申请已提交至审批流程，请关注审批进度" });
    setShowForm(false);
    setFormData(null);
    setAiInput("");
  };

  const handleNewForm = () => {
    setShowForm(true);
    setFormData(null);
    setAiInput("");
    setFilledFields(new Set());
    setTimeout(() => aiInputRef.current?.focus(), 100);
  };

  const switchFormType = (type: "travel" | "reimbursement") => {
    setFormType(type);
    setFormData(type === "travel" ? { ...emptyTravelForm } : { ...emptyReimbursementForm });
    setFilledFields(new Set());
  };

  if (showForm) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto" data-testid="page-expense-form">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <PenLine className="h-4 w-4 text-emerald-400" />
            </div>
            智能填单
          </h1>
          <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setFormData(null); }} className="text-slate-400 hover:text-slate-200 gap-1" data-testid="button-back-list">
            <X className="h-4 w-4" />
            返回
          </Button>
        </div>
        <div className="glass-card rounded-xl p-5 border border-purple-500/15">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI 一句话填单</span>
            <Badge variant="outline" className="text-[9px] h-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
              智能识别
            </Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-3">
            用自然语言描述您的出差或报销需求，AI 将自动识别并填写表单字段
          </p>
          <div className="relative">
            <textarea
              ref={aiInputRef}
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="例如：下周一去宁德拜访宁德时代张总，高铁往返，住2晚"
              className="glass-input w-full min-h-[80px] px-4 py-3 pb-12 text-sm rounded-xl resize-none leading-relaxed"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAIParse(); } }}
              data-testid="input-ai-sentence"
            />
            <Button
              size="icon"
              onClick={handleAIParse}
              disabled={!aiInput.trim() || aiParsing}
              className="absolute right-3 bottom-3 h-8 w-8 rounded-lg glow-btn text-white border-0"
              data-testid="button-ai-parse"
            >
              {aiParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {aiExamples.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setAiInput(ex); setTimeout(() => aiInputRef.current?.focus(), 50); }}
                className="text-[11px] px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-400/80 hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                data-testid={`ai-example-${i}`}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={formType === "travel" ? "default" : "outline"}
            size="sm"
            onClick={() => switchFormType("travel")}
            className={formType === "travel" ? "glow-btn text-white border-0 h-8 text-xs gap-1.5" : "h-8 text-xs border-blue-500/15 text-slate-400 hover:text-blue-300 hover:bg-blue-500/5 gap-1.5"}
            data-testid="tab-travel"
          >
            <Plane className="h-3.5 w-3.5" />
            出差申请单
          </Button>
          <Button
            variant={formType === "reimbursement" ? "default" : "outline"}
            size="sm"
            onClick={() => switchFormType("reimbursement")}
            className={formType === "reimbursement" ? "glow-btn text-white border-0 h-8 text-xs gap-1.5" : "h-8 text-xs border-blue-500/15 text-slate-400 hover:text-blue-300 hover:bg-blue-500/5 gap-1.5"}
            data-testid="tab-reimbursement"
          >
            <Receipt className="h-3.5 w-3.5" />
            报销单
          </Button>
          {formData && (
            <span className="ml-auto text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              AI 已自动填写
            </span>
          )}
        </div>
        {formType === "travel" && (
          <div className="glass-card rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Plane className="h-4 w-4 text-blue-400" />
              出差申请信息
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="出差目的地" value={(formData as TravelForm)?.destination ?? ""} onChange={v => updateTravelField("destination", v)} placeholder="如：宁德" icon={MapPin} highlight={filledFields.has("destination")} />
              <FormField label="拜访客户/单位" value={(formData as TravelForm)?.client ?? ""} onChange={v => updateTravelField("client", v)} placeholder="如：宁德时代" icon={Building2} highlight={filledFields.has("client")} />
              <FormField label="出发日期" value={(formData as TravelForm)?.departDate ?? ""} onChange={v => updateTravelField("departDate", v)} type="date" icon={Calendar} highlight={filledFields.has("departDate")} />
              <FormField label="返回日期" value={(formData as TravelForm)?.returnDate ?? ""} onChange={v => updateTravelField("returnDate", v)} type="date" icon={Calendar} highlight={filledFields.has("returnDate")} />
              <FormField label="交通方式" value={(formData as TravelForm)?.transport ?? ""} onChange={v => updateTravelField("transport", v)} placeholder="高铁/飞机/自驾" highlight={filledFields.has("transport")} />
              <FormField label="同行人员" value={(formData as TravelForm)?.companions ?? ""} onChange={v => updateTravelField("companions", v)} placeholder="如有同行请填写" icon={User} highlight={filledFields.has("companions")} />
            </div>
            <div className="border-t border-blue-500/10 pt-4">
              <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" />
                预算明细
              </h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="住宿预算" value={(formData as TravelForm)?.hotelBudget ?? ""} onChange={v => updateTravelField("hotelBudget", v)} placeholder="¥" highlight={filledFields.has("hotelBudget")} />
                <FormField label="餐饮预算" value={(formData as TravelForm)?.mealBudget ?? ""} onChange={v => updateTravelField("mealBudget", v)} placeholder="¥" highlight={filledFields.has("mealBudget")} />
                <FormField label="其他费用" value={(formData as TravelForm)?.otherCost ?? ""} onChange={v => updateTravelField("otherCost", v)} placeholder="¥" highlight={filledFields.has("otherCost")} />
              </div>
            </div>
            <FormField label="出差事由" value={(formData as TravelForm)?.purpose ?? ""} onChange={v => updateTravelField("purpose", v)} placeholder="请描述出差目的和计划" highlight={filledFields.has("purpose")} />
            <FormField label="备注" value={(formData as TravelForm)?.remarks ?? ""} onChange={v => updateTravelField("remarks", v)} placeholder="其他需要说明的事项" highlight={filledFields.has("remarks")} />
          </div>
        )}
        {formType === "reimbursement" && (
          <div className="glass-card rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-400" />
              报销单信息
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="报销标题" value={(formData as ReimbursementForm)?.title ?? ""} onChange={v => updateReimbursementField("title", v)} placeholder="如：广州出差费用报销" highlight={filledFields.has("title")} />
              <FormField label="费用类别" value={(formData as ReimbursementForm)?.category ?? ""} onChange={v => updateReimbursementField("category", v)} placeholder="差旅报销/业务招待/办公用品" highlight={filledFields.has("category")} />
              <FormField label="报销日期" value={(formData as ReimbursementForm)?.date ?? ""} onChange={v => updateReimbursementField("date", v)} type="date" icon={Calendar} highlight={filledFields.has("date")} />
              <FormField label="关联出差" value={(formData as ReimbursementForm)?.relatedTravel ?? ""} onChange={v => updateReimbursementField("relatedTravel", v)} placeholder="关联的出差申请" icon={Plane} highlight={filledFields.has("relatedTravel")} />
              <FormField label="关联客户" value={(formData as ReimbursementForm)?.client ?? ""} onChange={v => updateReimbursementField("client", v)} placeholder="相关客户名称" icon={Building2} highlight={filledFields.has("client")} />
              <FormField label="发票张数" value={(formData as ReimbursementForm)?.invoiceCount ?? ""} onChange={v => updateReimbursementField("invoiceCount", v)} placeholder="发票数量" icon={FileText} highlight={filledFields.has("invoiceCount")} />
            </div>

            <div className="border-t border-blue-500/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="h-3 w-3" />
                  费用明细
                </h4>
                <Button variant="ghost" size="sm" onClick={addReimbursementItem} className="h-6 text-[10px] text-blue-400 hover:text-blue-300 gap-1" data-testid="button-add-item">
                  <Plus className="h-3 w-3" />
                  添加
                </Button>
              </div>
              <div className="space-y-2">
                {(formData as ReimbursementForm)?.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2" data-testid={`expense-item-${idx}`}>
                    <input
                      value={item.name}
                      onChange={e => updateReimbursementItem(idx, "name", e.target.value)}
                      placeholder="费用名称"
                      className="glass-input flex-1 h-8 px-3 text-sm rounded-lg"
                      data-testid={`input-item-name-${idx}`}
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">¥</span>
                      <input
                        value={item.amount}
                        onChange={e => updateReimbursementItem(idx, "amount", e.target.value)}
                        placeholder="金额"
                        className="glass-input w-full h-8 pl-7 pr-3 text-sm rounded-lg text-right"
                        data-testid={`input-item-amount-${idx}`}
                      />
                    </div>
                    {(formData as ReimbursementForm)?.items.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeReimbursementItem(idx)} className="h-7 w-7 text-slate-500 hover:text-red-400 shrink-0" data-testid={`button-remove-item-${idx}`}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-blue-500/5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  合计：<span className="text-emerald-400">¥{((formData as ReimbursementForm)?.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0) ?? 0).toLocaleString()}</span>
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="收款人" value={(formData as ReimbursementForm)?.payee ?? ""} onChange={v => updateReimbursementField("payee", v)} placeholder="收款人姓名" icon={User} highlight={filledFields.has("payee")} />
              <FormField label="收款账户" value={(formData as ReimbursementForm)?.bankAccount ?? ""} onChange={v => updateReimbursementField("bankAccount", v)} placeholder="银行卡号" icon={CreditCard} highlight={filledFields.has("bankAccount")} />
            </div>
            <FormField label="备注" value={(formData as ReimbursementForm)?.remarks ?? ""} onChange={v => updateReimbursementField("remarks", v)} placeholder="其他需要说明的事项" highlight={filledFields.has("remarks")} />
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => { setShowForm(false); setFormData(null); }} className="border-slate-600 text-slate-400 hover:bg-slate-800/50" data-testid="button-cancel-form">
            取消
          </Button>
          <Button onClick={handleSubmit} className="glow-btn text-white border-0 font-medium gap-2 px-6" data-testid="button-submit-form">
            <ArrowRight className="h-4 w-4" />
            提交审批
          </Button>
        </div>
      </div>
    );
  }

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
        <Button onClick={handleNewForm} className="glow-btn text-white border-0 gap-2" data-testid="button-new-expense">
          <Sparkles className="h-4 w-4" />
          智能填单
        </Button>
      </div>

      <div className="glass-card rounded-xl p-4 border border-purple-500/10 cursor-pointer hover:border-purple-500/25 transition-colors" onClick={handleNewForm} data-testid="ai-entry-card">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI 一句话报销</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">描述出差或报销需求，AI 自动生成申请表单</p>
          </div>
          <div className="flex items-center gap-2 text-purple-400/60">
            <span className="text-xs hidden sm:block">试试说：</span>
            <span className="text-[11px] text-purple-400/80 bg-purple-500/5 px-3 py-1 rounded-full border border-purple-500/10 hidden md:block">"下周去宁德出差3天"</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
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
