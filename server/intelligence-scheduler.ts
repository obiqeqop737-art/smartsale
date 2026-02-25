import { db } from "./db";
import { intelligencePosts } from "@shared/schema";
import { GoogleGenAI } from "@google/genai";
import { log } from "./index";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

function getGenerationPrompt(): string {
  const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  return `你是一个锂电池和新能源行业的资深分析师。今天是 ${today}。

请基于网络搜索结果，生成4条【最近一周内】真实发生的行业情报，用于企业内部的"情报雷达"模块。

严格要求：
1. 所有情报必须是最近7天内的真实新闻事件，不要编造或使用过期信息
2. 必须基于搜索到的真实数据和事实，注明真实的来源媒体
3. 每条情报必须包含以下字段（JSON格式）：
   - category: 从 "industry"（行业动态）、"competitor"（竞争对手）、"supply_chain"（供应链）中选择
   - title: 标题，20-40字，具体且有数据
   - source: 真实的来源媒体名称
   - summary: 摘要，80-150字，包含具体数据和事实
   - aiInsight: AI洞察建议，50-100字，针对销售团队的行动建议
   - tags: 3-4个关键词标签数组

4. 4条情报的类别分布：至少包含2个不同类别
5. 关注领域：锂电池、新能源汽车、储能、固态电池、原材料价格、碳酸锂、产能动态等
6. 每条情报应有不同的角度和主题，避免重复

请直接返回JSON数组，不要包含任何其他文字或markdown标记。格式如下：
[
  { "category": "...", "title": "...", "source": "...", "summary": "...", "aiInsight": "...", "tags": ["...", "..."] },
  ...
]`;
}

let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let lastGeneratedAt: Date | null = null;

export async function generateIntelligence(): Promise<number> {
  log("Starting AI intelligence generation...", "scheduler");

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: getGenerationPrompt() }] }],
      config: {
        maxOutputTokens: 4096,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = result.text?.trim() || "";

    let jsonText = text;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const posts = JSON.parse(jsonText);

    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error("AI returned invalid format");
    }

    const now = new Date();
    const insertData = posts.map((p: any, idx: number) => ({
      category: p.category || "industry",
      title: p.title,
      source: p.source,
      summary: p.summary,
      aiInsight: p.aiInsight || null,
      tags: p.tags || [],
      publishedAt: new Date(now.getTime() - idx * 1800000),
    }));

    await db.insert(intelligencePosts).values(insertData);
    lastGeneratedAt = now;

    log(`Generated ${insertData.length} intelligence posts successfully`, "scheduler");
    return insertData.length;
  } catch (error) {
    log(`Intelligence generation failed: ${error}`, "scheduler");
    throw error;
  }
}

function getMillisUntilNextNoon(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(12, 0, 0, 0);

  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

function scheduleNext() {
  const ms = getMillisUntilNextNoon();
  const hours = (ms / 3600000).toFixed(1);
  const nextTime = new Date(Date.now() + ms);
  log(`Next intelligence update scheduled at ${nextTime.toLocaleString("zh-CN")} (in ${hours}h)`, "scheduler");

  schedulerTimer = setTimeout(async () => {
    try {
      await generateIntelligence();
    } catch (err) {
      log(`Scheduled generation error: ${err}`, "scheduler");
    }
    scheduleNext();
  }, ms);
}

export function startIntelligenceScheduler() {
  log("Intelligence scheduler started - updates daily at 12:00", "scheduler");
  scheduleNext();
}

export function stopIntelligenceScheduler() {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
    log("Intelligence scheduler stopped", "scheduler");
  }
}

export function getSchedulerStatus() {
  const ms = getMillisUntilNextNoon();
  const nextTime = new Date(Date.now() + ms);
  return {
    running: schedulerTimer !== null,
    nextUpdateAt: nextTime.toISOString(),
    lastGeneratedAt: lastGeneratedAt?.toISOString() || null,
    schedule: "每天 12:00",
  };
}
