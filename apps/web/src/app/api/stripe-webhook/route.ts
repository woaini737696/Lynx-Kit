/**
 * POST /api/stripe-webhook
 *
 * 接收 Stripe Webhook 通知，验签后处理支付完成事件。
 *
 * - 验证 Stripe 签名（HMAC-SHA256，使用 Node 内置 crypto，无需 stripe SDK）
 * - 处理 `checkout.session.completed` 事件
 * - 调用后端 API 更新订单状态为已完成
 *
 * 环境变量：
 *   STRIPE_WEBHOOK_SECRET  Stripe Webhook 签名密钥
 *   API_SERVICE_TOKEN      调用后端的服务间令牌（用于后端鉴权）
 */
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 直接读取环境变量，避免在 Route Handler 中引入客户端 api-client / store / toast
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** 签名时间戳容差（秒），超过则视为重放攻击 */
const TOLERANCE_SECONDS = 300;

interface StripeSignature {
  timestamp: number;
  v1: string;
}

/**
 * 解析 Stripe 签名头：`t=1234567890,v1=abcdef...`
 */
function parseSignature(header: string): StripeSignature | null {
  const parts = header.split(",");
  let timestamp: number | null = null;
  let v1: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = Number(value);
    if (key === "v1") v1 = value;
  }

  if (timestamp === null || Number.isNaN(timestamp) || !v1) return null;
  return { timestamp, v1 };
}

/**
 * 验证 Stripe Webhook 签名
 */
function verifySignature(
  payload: string,
  header: string,
  secret: string,
): boolean {
  const sig = parseSignature(header);
  if (!sig) return false;

  // 防重放：时间戳超出容差则拒绝
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - sig.timestamp) > TOLERANCE_SECONDS) return false;

  const signedPayload = `${sig.timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  // 时序安全比较
  const a = Buffer.from(expected);
  const b = Buffer.from(sig.v1);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface StripeEvent {
  id: string;
  type: string;
  data?: {
    object?: {
      id?: string;
      client_reference_id?: string;
      metadata?: Record<string, string> | null;
      amount_total?: number;
      payment_status?: string;
    };
  };
}

/**
 * 调用后端 API 将订单状态更新为已完成
 *
 * 期望的后端契约：POST /api/v1/store/transactions/:id/complete
 * （由服务间令牌 API_SERVICE_TOKEN 鉴权）
 */
async function completeOrder(
  transactionId: string,
  sessionId: string,
): Promise<void> {
  const token = process.env.API_SERVICE_TOKEN;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/store/transactions/${encodeURIComponent(transactionId)}/complete`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId }),
      },
    );

    if (!res.ok) {
      // 后端调用失败：记录但不抛出，避免 Stripe 重试风暴（Webhook 已确认收到）
      const text = await res.text().catch(() => "");
      console.error(
        `[stripe-webhook] 后端更新订单失败 tx=${transactionId} status=${res.status} body=${text}`,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] 未配置 STRIPE_WEBHOOK_SECRET");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const payload = await request.text();

  if (!verifySignature(payload, signature, secret)) {
    console.warn("[stripe-webhook] 签名校验失败");
    return new Response("Invalid signature", { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    console.warn("[stripe-webhook] payload 非法 JSON");
    return new Response("Invalid payload", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data?.object;
      const transactionId =
        session?.metadata?.transactionId ??
        session?.client_reference_id ??
        null;
      const sessionId = session?.id ?? "";

      if (transactionId) {
        await completeOrder(transactionId, sessionId);
        console.info(
          `[stripe-webhook] 订单完成 tx=${transactionId} session=${sessionId}`,
        );
      } else {
        console.warn(
          `[stripe-webhook] checkout.session.completed 缺少 transactionId`,
        );
      }
      break;
    }
    default:
      // 忽略其它事件类型（ack 即可）
      break;
  }

  return Response.json({ received: true, type: event.type });
}
