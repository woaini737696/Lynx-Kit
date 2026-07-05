"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Coins,
  Crown,
  Wallet,
  X,
  Zap,
  Bot,
  Calendar,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { getClient } from "@/lib/api";
import { useAuthStore } from "@lynxkit/store";
import { Spinner } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";

/**
 * 用户中心 · 会员中心页
 *
 * - 当前会员档位卡片（大卡片：档位 / 到期时间 / 月度 S 币配额）
 * - S 币余额卡片（当前余额 / 今日已消耗 / 累计获得）
 * - 升级会员档位对比（4 档卡片网格：FREE/LITE/PRO/MAX）
 * - S 币流水表格（最近 20 条）
 *
 * API：
 *   GET /v1/membership/plans               公开档位列表
 *   GET /v1/membership/me                  当前会员 + S 币余额
 *   GET /v1/membership/scoin/transactions  S 币流水
 *
 * Token 通过 @lynxkit/store 的 auth-store 持久化，由 @/lib/api 的 getClient 自动注入。
 */

// ===== Types =====

type Tier = "FREE" | "LITE" | "PRO" | "MAX";

interface PlanFeaturesRaw {
  dailyTokenLimit?: number | string;
  dailyTokens?: number | string;
  models?: string[];
  availableModels?: string[];
  features?: string[] | Record<string, boolean>;
  perks?: string[];
  [key: string]: unknown;
}

interface Plan {
  id: string;
  tier: Tier;
  name: string;
  priceMonthly: string | number;
  priceYearly: string | number;
  monthlySCoinGrant: number;
  tokenToSCoinRate: number;
  features: PlanFeaturesRaw | string[] | null;
  sortOrder: number;
}

interface Membership {
  id: string;
  tier: Tier;
  status: string;
  source: string;
  startedAt: string;
  expiresAt: string | null;
  durationMonths: number;
}

interface PlanSummary {
  name: string;
  tier: Tier;
  priceMonthly: string | number;
  monthlySCoinGrant: number;
  tokenToSCoinRate: number;
  features: PlanFeaturesRaw | string[] | null;
}

interface SCoinBalance {
  balance: number;
  frozenBalance: number;
  totalGranted: number;
  totalConsumed: number;
}

interface Transaction {
  id: string;
  type: string;
  delta: number;
  balanceAfter: number;
  refType: string | null;
  refId: string | null;
  note: string | null;
  createdAt: string;
}

interface MeResponse {
  membership: Membership | null;
  plan: PlanSummary | null;
  scoinBalance: SCoinBalance;
}

interface PlansResponse {
  list: Plan[];
}

interface TransactionsResponse {
  list: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

interface ParsedFeatures {
  dailyTokenLimit?: string;
  models: string[];
  features: string[];
}

// ===== Constants =====

const TX_TYPE_LABELS: Record<string, string> = {
  RECHARGE: "充值",
  CONSUME: "消耗",
  GRANT: "赠送",
  REFUND: "退款",
  EXCHANGE: "兑换",
  ADJUST: "调整",
  SIGN_IN: "签到",
  PURCHASE: "购买",
};

const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "生效中",
  EXPIRED: "已过期",
  CANCELED: "已取消",
  SUSPENDED: "已暂停",
  CANCELLED: "已取消",
};

// ===== Helpers =====

function formatPrice(v: string | number): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = formatDate(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${hh}:${mm}`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function parseFeatures(
  raw: PlanFeaturesRaw | string[] | null | undefined,
): ParsedFeatures {
  const empty: ParsedFeatures = { models: [], features: [] };
  if (!raw) return empty;
  if (Array.isArray(raw)) {
    return { ...empty, features: raw as string[] };
  }
  if (typeof raw === "object") {
    const f = raw as PlanFeaturesRaw;
    const limit = f.dailyTokenLimit ?? f.dailyTokens;
    const models = f.models ?? f.availableModels ?? [];
    let featureList: string[] = [];
    if (Array.isArray(f.features)) {
      featureList = f.features as string[];
    } else if (f.features && typeof f.features === "object") {
      featureList = Object.entries(f.features as Record<string, boolean>)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
    }
    if (f.perks && Array.isArray(f.perks)) {
      featureList = [...featureList, ...f.perks];
    }
    return {
      dailyTokenLimit: limit !== undefined ? String(limit) : undefined,
      models,
      features: featureList,
    };
  }
  return empty;
}

function tierSortWeight(tier: Tier): number {
  switch (tier) {
    case "FREE":
      return 0;
    case "LITE":
      return 1;
    case "PRO":
      return 2;
    case "MAX":
      return 3;
    default:
      return 99;
  }
}

function formatTokenLimit(limit?: string): string {
  if (!limit) return "—";
  const n = Number(limit);
  if (!Number.isFinite(n)) return limit;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return limit;
}

// ===== 档位徽章 - FREE 灰色 / LITE 蓝色边框 / PRO ink-700 边框 / MAX 黑色填充白字 =====
function TierBadge({ tier }: { tier: Tier }) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  switch (tier) {
    case "FREE":
      return (
        <span
          className={cn(
            base,
            "border border-ink-200 bg-ink-100 text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300",
          )}
        >
          FREE
        </span>
      );
    case "LITE":
      return (
        <span className={cn(base, "border border-blue-300 bg-blue-50 text-blue-700")}>
          LITE
        </span>
      );
    case "PRO":
      return (
        <span
          className={cn(
            base,
            "border-2 border-ink-700 bg-ink-50 text-ink-900 dark:bg-ink-900 dark:text-ink-100",
          )}
        >
          PRO
        </span>
      );
    case "MAX":
      return (
        <span className={cn(base, "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950")}>
          MAX
        </span>
      );
    default:
      return null;
  }
}

// ===== 主组件 =====
export default function MembershipPage() {
  const token = useAuthStore((s) => s.token);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [upgradeTarget, setUpgradeTarget] = useState<Plan | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const client = getClient();
      const [plansRes, meRes, txRes] = await Promise.all([
        client.get<PlansResponse>("/v1/membership/plans"),
        client.get<MeResponse>("/v1/membership/me"),
        client.get<TransactionsResponse>(
          "/v1/membership/scoin/transactions?page=1&pageSize=20",
        ),
      ]);
      const sorted = [...(plansRes.list ?? [])].sort(
        (a, b) =>
          (a.sortOrder - b.sortOrder) ||
          (tierSortWeight(a.tier) - tierSortWeight(b.tier)),
      );
      setPlans(sorted);
      setMe(meRes);
      setTransactions(txRes.list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const client = getClient();
      const [meRes, txRes] = await Promise.all([
        client.get<MeResponse>("/v1/membership/me"),
        client.get<TransactionsResponse>(
          "/v1/membership/scoin/transactions?page=1&pageSize=20",
        ),
      ]);
      setMe(meRes);
      setTransactions(txRes.list ?? []);
    } catch {
      // 静默：失败时不打扰主错误态
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void load();
    }
  }, [token, load]);

  // ===== Derived =====
  const currentTier: Tier = me?.membership?.tier ?? "FREE";
  const scoin: SCoinBalance = me?.scoinBalance ?? {
    balance: 0,
    frozenBalance: 0,
    totalGranted: 0,
    totalConsumed: 0,
  };
  const todayConsumed = transactions
    .filter((t) => t.delta < 0 && isToday(t.createdAt))
    .reduce((sum, t) => sum + Math.abs(t.delta), 0);

  // ===== 初始加载骨架 =====
  if (loading && !me) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-6 w-6 text-ink-950 dark:text-ink-50" />
        <span className="ml-2 text-sm text-ink-500">加载会员信息中…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950 dark:text-ink-50">
          会员中心
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          管理你的会员档位、S 币余额与流水记录
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm font-medium text-red-500 transition-colors hover:text-red-700"
          >
            重试
          </button>
        </div>
      )}

      {/* 顶部状态行：当前档位 + S 币余额 */}
      <div className="grid gap-5 md:grid-cols-2">
        <CurrentTierCard me={me} currentTier={currentTier} />
        <SCoinBalanceCard
          scoin={scoin}
          todayConsumed={todayConsumed}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      </div>

      {/* 升级档位对比 */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink-950 dark:text-ink-50">
              升级会员档位
            </h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
              选择适合你的档位，解锁更多权益
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.tier === currentTier}
              onUpgrade={(p) => setUpgradeTarget(p)}
            />
          ))}
          {plans.length === 0 && !loading && (
            <div className="col-span-full rounded-2xl border border-dashed border-ink-200 bg-white/40 px-6 py-12 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-white/5">
              暂无档位数据
            </div>
          )}
        </div>
      </section>

      {/* S 币流水 */}
      <section id="scoin">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink-950 dark:text-ink-50">
              S 币流水
            </h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
              最近 20 条变动记录
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/60 bg-white/55 px-3 py-1.5 text-sm text-ink-600 backdrop-blur-xl transition-colors hover:bg-white/72 hover:text-ink-950 disabled:opacity-50 dark:border-ink-700/60 dark:bg-white/5 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-ink-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            刷新
          </button>
        </div>
        <TransactionsTable
          transactions={transactions}
          loading={loading || refreshing}
        />
      </section>

      {/* 升级提示弹窗 */}
      {upgradeTarget && (
        <UpgradeModal
          plan={upgradeTarget}
          onClose={() => setUpgradeTarget(null)}
        />
      )}
    </div>
  );
}

// ===== 当前档位卡片 =====
function CurrentTierCard({
  me,
  currentTier,
}: {
  me: MeResponse | null;
  currentTier: Tier;
}) {
  const membership = me?.membership ?? null;
  const plan = me?.plan ?? null;
  const status = membership?.status ?? null;
  const statusLabel = status
    ? MEMBERSHIP_STATUS_LABELS[status] ?? status
    : "未开通";
  const isActive = status === "ACTIVE";

  return (
    <div className="glass-card relative overflow-hidden p-6">
      {/* 装饰角标 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-ink-100/60 blur-2xl dark:bg-ink-800/30"
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
            当前档位
          </span>
          <TierBadge tier={currentTier} />
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <Crown className="h-6 w-6 text-ink-950 dark:text-ink-50" />
          <h3 className="text-2xl font-bold tracking-tight text-ink-950 dark:text-ink-50">
            {plan?.name ?? `${currentTier} 版`}
          </h3>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-1.5 w-1.5 rounded-full",
              isActive ? "bg-ink-950 dark:bg-ink-100" : "bg-ink-300",
            )}
          />
          <span className="text-sm text-ink-500 dark:text-ink-400">
            {statusLabel}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-ink-200/60 pt-5 dark:border-ink-800/60">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-ink-400">
              <Calendar className="h-3.5 w-3.5" />
              到期时间
            </div>
            <p className="mt-1.5 font-mono text-sm font-medium text-ink-900 dark:text-ink-50">
              {membership?.expiresAt ? formatDate(membership.expiresAt) : "永久"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-ink-400">
              <Coins className="h-3.5 w-3.5" />
              月度 S 币配额
            </div>
            <p className="mt-1.5 font-mono text-sm font-medium text-ink-900 dark:text-ink-50">
              {plan?.monthlySCoinGrant?.toLocaleString() ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== S 币余额卡片 =====
function SCoinBalanceCard({
  scoin,
  todayConsumed,
  refreshing,
  onRefresh,
}: {
  scoin: SCoinBalance;
  todayConsumed: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="glass-card relative overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-ink-200/50 blur-2xl dark:bg-ink-700/20"
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
            S 币余额
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-ink-400 transition-colors hover:text-ink-950 disabled:opacity-50 dark:hover:text-ink-50"
            aria-label="刷新余额"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </button>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <Wallet className="h-6 w-6 text-ink-950 dark:text-ink-50" />
          <span className="font-mono text-3xl font-bold tracking-tight text-ink-950 dark:text-ink-50">
            {scoin.balance.toLocaleString()}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-ink-200/60 pt-5 dark:border-ink-800/60">
          <div>
            <div className="flex items-center gap-1 text-xs text-ink-400">
              <TrendingDown className="h-3 w-3" />
              今日已消耗
            </div>
            <p className="mt-1.5 font-mono text-sm font-medium text-ink-900 dark:text-ink-50">
              {todayConsumed.toLocaleString()}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-ink-400">
              <TrendingUp className="h-3 w-3" />
              累计获得
            </div>
            <p className="mt-1.5 font-mono text-sm font-medium text-ink-900 dark:text-ink-50">
              {scoin.totalGranted.toLocaleString()}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-ink-400">
              <Coins className="h-3 w-3" />
              累计消耗
            </div>
            <p className="mt-1.5 font-mono text-sm font-medium text-ink-900 dark:text-ink-50">
              {scoin.totalConsumed.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 档位对比卡片 =====
function PlanCard({
  plan,
  isCurrent,
  onUpgrade,
}: {
  plan: Plan;
  isCurrent: boolean;
  onUpgrade: (plan: Plan) => void;
}) {
  const parsed = parseFeatures(plan.features);
  const price = formatPrice(plan.priceMonthly);

  return (
    <article
      className={cn(
        "glass-card relative flex flex-col p-5 transition-all duration-200",
        isCurrent
          ? "border-2 border-ink-950 shadow-[0_8px_32px_rgba(15,23,42,0.12)] dark:border-ink-100"
          : "hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.10)]",
      )}
    >
      {/* 当前档位标签 */}
      {isCurrent && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="badge-ink whitespace-nowrap text-[10px]">
            当前档位
          </span>
        </div>
      )}

      {/* 档位标识 */}
      <div className="flex items-center justify-between">
        <TierBadge tier={plan.tier} />
        {plan.tier === "MAX" && (
          <Sparkles className="h-4 w-4 text-ink-950 dark:text-ink-50" />
        )}
      </div>

      {/* 档位名称 */}
      <h3 className="mt-3 text-base font-semibold tracking-tight text-ink-950 dark:text-ink-50">
        {plan.name}
      </h3>

      {/* 价格 */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight text-ink-950 dark:text-ink-50">
          ¥{price}
        </span>
        <span className="text-sm text-ink-500 dark:text-ink-400">/月</span>
      </div>

      {/* 权益摘要 */}
      <div className="mt-5 space-y-2.5 border-t border-ink-200/60 pt-4 dark:border-ink-800/60">
        <div className="flex items-center gap-2 text-xs">
          <Coins className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="text-ink-500 dark:text-ink-400">月度 S 币</span>
          <span className="ml-auto font-mono font-medium text-ink-900 dark:text-ink-50">
            {plan.monthlySCoinGrant.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Zap className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="text-ink-500 dark:text-ink-400">日 Token 额度</span>
          <span className="ml-auto font-mono font-medium text-ink-900 dark:text-ink-50">
            {formatTokenLimit(parsed.dailyTokenLimit)}
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <Bot className="mt-px h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="text-ink-500 dark:text-ink-400">可用模型</span>
          <span className="ml-auto max-w-[60%] text-right font-medium text-ink-900 dark:text-ink-50">
            {parsed.models.length > 0 ? parsed.models.join(" / ") : "—"}
          </span>
        </div>
      </div>

      {/* 功能特性列表 */}
      {parsed.features.length > 0 && (
        <ul className="mt-4 flex-1 space-y-2 border-t border-ink-200/60 pt-4 dark:border-ink-800/60">
          {parsed.features.map((feat, i) => (
            <li key={`${feat}-${i}`} className="flex items-start gap-2 text-xs">
              <Check className="mt-px h-3.5 w-3.5 shrink-0 text-ink-950 dark:text-ink-100" />
              <span className="text-ink-600 dark:text-ink-300">{feat}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 升级按钮 */}
      <div className="mt-5 pt-2">
        {isCurrent ? (
          <div className="rounded-full border border-ink-200 bg-ink-50 py-2 text-center text-xs font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-400">
            当前档位
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onUpgrade(plan)}
            className="btn-ink w-full text-sm"
          >
            升级到 {plan.name}
          </button>
        )}
      </div>
    </article>
  );
}

// ===== S 币流水表格 =====
function TransactionsTable({
  transactions,
  loading,
}: {
  transactions: Transaction[];
  loading: boolean;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/60 dark:border-ink-800 dark:bg-ink-900/40">
              <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                类型
              </th>
              <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                变动
              </th>
              <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                变动后余额
              </th>
              <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                关联
              </th>
              <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                备注
              </th>
              <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
                时间
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200 dark:divide-ink-800">
            {loading && transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-sm text-ink-400"
                >
                  加载中...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-sm text-ink-400"
                >
                  暂无流水数据
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const positive = tx.delta > 0;
                const typeLabel =
                  TX_TYPE_LABELS[tx.type] ?? tx.type ?? "—";
                return (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-ink-50/60 dark:hover:bg-ink-900/40"
                  >
                    {/* 类型 */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
                        {typeLabel}
                      </span>
                    </td>
                    {/* 变动 */}
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "font-mono text-sm font-medium",
                          positive
                            ? "text-ink-950 dark:text-ink-50"
                            : "text-ink-500 dark:text-ink-400",
                        )}
                      >
                        {positive ? "+" : ""}
                        {tx.delta.toLocaleString()}
                      </span>
                    </td>
                    {/* 变动后余额 */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm text-ink-700 dark:text-ink-300">
                        {tx.balanceAfter.toLocaleString()}
                      </span>
                    </td>
                    {/* 关联 */}
                    <td className="px-5 py-3.5">
                      {tx.refType ? (
                        <span className="inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-xs text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
                          {tx.refType}
                        </span>
                      ) : (
                        <span className="text-sm text-ink-300 dark:text-ink-600">
                          —
                        </span>
                      )}
                    </td>
                    {/* 备注 */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-600 dark:text-ink-300">
                        {tx.note ?? "—"}
                      </span>
                    </td>
                    {/* 时间 */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-500 dark:text-ink-400">
                        {formatDateTime(tx.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {transactions.length > 0 && (
        <div className="border-t border-ink-200 px-5 py-3 dark:border-ink-800">
          <p className="text-xs text-ink-400">
            显示最近 {transactions.length} 条流水
          </p>
        </div>
      )}
    </div>
  );
}

// ===== 升级提示弹窗（毛玻璃） =====
function UpgradeModal({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  // ESC 关闭
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px] dark:bg-ink-950/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="升级会员"
    >
      <div
        className="glass-card-strong m-4 w-full max-w-md p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-5 top-5 text-ink-400 transition-colors hover:text-ink-950 dark:hover:text-ink-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 图标 */}
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-950 text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] dark:bg-ink-100 dark:text-ink-950">
            <Crown className="h-6 w-6" />
          </div>
        </div>

        {/* 标题 */}
        <h3 className="mt-5 text-center text-xl font-semibold tracking-tight text-ink-950 dark:text-ink-50">
          升级到 {plan.name}
        </h3>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <TierBadge tier={plan.tier} />
          <span>¥{formatPrice(plan.priceMonthly)}/月</span>
          <span className="text-ink-300 dark:text-ink-600">·</span>
          <span>{plan.monthlySCoinGrant.toLocaleString()} S 币/月</span>
        </div>

        {/* 提示信息 */}
        <p className="mt-6 rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-center text-sm text-ink-600 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300">
          暂未开放在线支付，请联系客服开通
        </p>

        {/* 操作按钮 */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="btn-ink w-full text-sm"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
