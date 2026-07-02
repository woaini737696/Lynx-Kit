import OpenAI from "openai";

/**
 * AI 调用封装
 * - 默认 DeepSeek-V3（OpenAI 兼容 API）
 * - 可通过环境变量切换到 OpenAI / 其他兼容 provider
 * - 同时封装 embedding（默认 text-embedding-3-large，1536 维）
 */
const AI_API_KEY = process.env.AI_API_KEY ?? "{{AI_API_KEY}}";
const AI_BASE_URL = process.env.AI_BASE_URL ?? "{{AI_BASE_URL}}";

export const ai = new OpenAI({
  apiKey: AI_API_KEY,
  baseURL: AI_BASE_URL,
});

export const CHAT_MODEL = process.env.AI_CHAT_MODEL ?? "deepseek-chat";
export const EMBEDDING_MODEL =
  process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-large";

/**
 * 通用对话补全
 */
export async function chat(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  opts: { temperature?: number; maxTokens?: number } = {}
) {
  const res = await ai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.8,
    max_tokens: opts.maxTokens ?? 512,
  });
  return res.choices[0]?.message?.content ?? "";
}

/**
 * 生成兴趣向量（用于 pgvector 匹配）
 */
export async function embed(text: string): Promise<number[]> {
  const res = await ai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0]?.embedding ?? [];
}

/**
 * 情感分析：positive / neutral / negative
 */
export async function sentiment(content: string): Promise<string> {
  const label = await chat(
    [
      {
        role: "system",
        content:
          "你是情感分析助手。只输出一个单词：positive / neutral / negative。",
      },
      { role: "user", content },
    ],
    { temperature: 0, maxTokens: 8 }
  );
  const t = label.trim().toLowerCase();
  if (t.includes("positive")) return "positive";
  if (t.includes("negative")) return "negative";
  return "neutral";
}
