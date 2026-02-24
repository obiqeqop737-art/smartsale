import { db } from "./db";
import { intelligencePosts } from "@shared/schema";
import { sql } from "drizzle-orm";

const seedIntelligence = [
  {
    category: "industry",
    title: "宁德时代发布新一代麒麟电池，能量密度突破255Wh/kg",
    source: "新能源产业观察",
    summary: "宁德时代正式发布第三代麒麟电池技术，能量密度达到255Wh/kg，较上一代提升12%。新电池支持10分钟快充至80%，将于2026年Q2量产。首批客户包括理想、极氪等品牌。",
    aiInsight: "麒麟电池技术升级将加速行业洗牌，中低端电芯厂商价格压力增大。建议关注下游整车厂的供应链切换节奏，提前布局客户关系。",
    tags: ["宁德时代", "麒麟电池", "快充技术", "能量密度"],
    publishedAt: new Date(Date.now() - 2 * 3600000),
  },
  {
    category: "competitor",
    title: "比亚迪弗迪电池独立上市计划提速，估值超500亿",
    source: "财联社",
    summary: "据知情人士透露，比亚迪旗下弗迪电池正加速推进独立上市进程，预计2026年下半年提交IPO申请。弗迪电池目前已向多家外部车企供货，包括丰田、福特等国际品牌。",
    aiInsight: "弗迪独立上市意味着比亚迪将更积极争夺外部客户，我方在二三线车企的份额可能受到冲击。需加强客户粘性和差异化服务。",
    tags: ["比亚迪", "弗迪电池", "IPO", "竞争格局"],
    publishedAt: new Date(Date.now() - 5 * 3600000),
  },
  {
    category: "supply_chain",
    title: "碳酸锂价格持续回落至7.2万元/吨，创18个月新低",
    source: "上海有色金属网",
    summary: "电池级碳酸锂价格本周跌破7.5万元/吨关口，最新报价7.2万元/吨，环比下降3.8%。主要原因是上游锂矿产能过剩和下游需求增速放缓。分析师预计短期内价格仍有下行空间。",
    aiInsight: "原材料价格走低利好电芯制造成本，可作为与客户谈判的筹码。建议近期与采购部门协同，锁定低价库存。",
    tags: ["碳酸锂", "原材料", "价格走势", "成本优化"],
    publishedAt: new Date(Date.now() - 8 * 3600000),
  },
  {
    category: "industry",
    title: "欧盟正式实施电池碳足迹法规，中国企业面临合规挑战",
    source: "第一财经",
    summary: "欧盟《电池与废电池法规》碳足迹声明要求正式生效。2026年起，所有在欧销售的动力电池必须提供全生命周期碳足迹报告。目前仅少数中国头部企业完成相关认证。",
    aiInsight: "碳足迹合规将成为出海竞争的新壁垒，具备碳足迹认证的供应商将获得溢价能力。建议对接认证团队，加速合规进程。",
    tags: ["欧盟法规", "碳足迹", "出口合规", "绿色认证"],
    publishedAt: new Date(Date.now() - 12 * 3600000),
  },
  {
    category: "competitor",
    title: "中创新航获得大众集团20GWh长期供货合同",
    source: "路透社",
    summary: "中创新航与大众汽车集团签署战略合作协议，将在未来5年内供应超过20GWh动力电池。产品将用于大众旗下ID系列车型的欧洲市场版本，交付起始时间为2027年。",
    aiInsight: "中创新航拿下大众订单将显著提升其产能利用率和品牌影响力。我方需评估对共同客户的潜在分流风险，强化技术差异化优势。",
    tags: ["中创新航", "大众汽车", "供货合同", "国际市场"],
    publishedAt: new Date(Date.now() - 24 * 3600000),
  },
  {
    category: "supply_chain",
    title: "印尼镍矿出口政策收紧，HPAL镍产能扩张放缓",
    source: "矿业周刊",
    summary: "印尼政府宣布进一步收紧镍矿石出口配额，要求更多冶炼加工在本地完成。受此影响，多个在建HPAL项目进度延迟，三元前驱体供应链面临不确定性。",
    aiInsight: "镍供应紧张可能推高三元材料成本，LFP路线的性价比优势将进一步凸显。建议向客户推荐LFP解决方案，抢占市场替代窗口。",
    tags: ["印尼镍矿", "三元材料", "供应链风险", "LFP"],
    publishedAt: new Date(Date.now() - 36 * 3600000),
  },
  {
    category: "industry",
    title: "固态电池商业化进程加速：丰田宣布2027年量产",
    source: "日经新闻",
    summary: "丰田汽车正式确认全固态电池将于2027年开始量产，首批搭载车型为Lexus品牌。该电池续航可达1000km，充电时间缩短至10分钟以内。丰田已与出光兴产合作完成硫化物固态电解质的量产验证。",
    aiInsight: "固态电池虽短期难以冲击液态锂电市场，但技术储备布局迫在眉睫。建议研发团队跟踪硫化物路线进展，评估技术引进或自研策略。",
    tags: ["固态电池", "丰田", "技术前沿", "竞争预判"],
    publishedAt: new Date(Date.now() - 48 * 3600000),
  },
  {
    category: "industry",
    title: "国内储能市场Q1装机量同比增长67%，大储项目集中放量",
    source: "中关村储能产业联盟",
    summary: "2026年Q1国内新增储能装机12.8GWh，同比增长67%。其中大型储能项目占比超过80%，新疆、内蒙古、甘肃等风光资源富集地区贡献最大增量。",
    aiInsight: "储能市场持续高增长为电芯销售开辟第二增长曲线。建议拓展储能客户渠道，尤其是西北地区的EPC总包商和电力开发企业。",
    tags: ["储能", "装机量", "大型储能", "市场增长"],
    publishedAt: new Date(Date.now() - 60 * 3600000),
  },
];

export async function seedDatabase() {
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(intelligencePosts);
    if (Number(existing[0].count) > 0) {
      console.log("Intelligence posts already seeded, skipping...");
      return;
    }

    await db.insert(intelligencePosts).values(seedIntelligence);
    console.log("Seeded intelligence posts successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
