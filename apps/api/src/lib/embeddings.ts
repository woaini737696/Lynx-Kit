/**
 * 智谱 GLM embedding-3 客户端
 *
 * 用于商店语义检索：把文本（产品描述 / 搜索查询）转为 1024 维向量，
 * 与 store_products.embeddings（pgvector vector(1024)）做 cosine 相似度匹配。
 *
 * API 文档：https://open.bigmodel.cn/api/paas/v4/embeddings
 * - POST https://open.bigmodel.cn/api/paas/v4/embeddings
 * - Body: { model: "embedding-3", input: "文本", dimensions: 1024 }
 * - Response: { data: [{ embedding: number[] }] }
 *
 * 当 GLM_API_KEY 未配置或调用失败时，返回 null，
 * 上层逻辑（store 搜索）应 graceful degrade 为纯关键词检索。
 */

import { env } from "../env.js";

/** GLM embedding API 入参 */
interface GlmEmbeddingRequest {
  model: string;
  input: string;
  dimensions?: number;
}

/** GLM embedding API 响应 */
interface GlmEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

const GLM_API_BASE = "https://open.bigmodel.cn/api/paas/v4";
const EMBEDDING_MODEL = "embedding-3";
const EMBEDDING_DIMENSIONS = 1024;

/**
 * 把单段文本转为 1024 维向量。
 *
 * @param text 待向量化文本（建议 ≤ 512 tokens）
 * @returns 1024 维 number[]；当 API key 未配置或调用失败时返回 null
 */
export async function embedText(text: string): Promise<number[] | null> {
  if (!env.GLM_API_KEY) {
    return null;
  }

  const body: GlmEmbeddingRequest = {
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  };

  try {
    const res = await fetch(`${GLM_API_BASE}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GLM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "<unreadable>");
      console.warn(
        `[embeddings] GLM API 调用失败：HTTP ${res.status} ${res.statusText} body=${errText.slice(0, 200)}`,
      );
      return null;
    }

    const json = (await res.json()) as GlmEmbeddingResponse;
    const embedding = json.data?.[0]?.embedding;

    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      console.warn(
        `[embeddings] GLM API 返回维度异常：期望 ${EMBEDDING_DIMENSIONS}，实际 ${embedding?.length ?? "undefined"}`,
      );
      return null;
    }

    return embedding;
  } catch (err) {
    console.warn(`[embeddings] GLM 调用异常：`, err);
    return null;
  }
}

/**
 * 把向量转为 pgvector 字符串字面量。
 *
 * pgvector 接受 '[1,2,3]' 字符串作为输入参数，配合 SQL：
 *   WHERE embeddings <=> ${vectorLiteral}::vector
 *
 * @param vector 1024 维 number[]
 * @returns pgvector 字符串字面量（如 '[0.1,0.2,...]'）
 */
export function toPgVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
