"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminApi,
  type MembershipInfo,
  type MembershipPlan,
  type MembershipSource,
  type MembershipTier,
  type MembershipUser,
  type SCoinTransaction,
} from "@/lib/api";
import { cn, formatDate, formatPhone } from "@/lib/utils";

const TIER_OPTIONS: { value: MembershipTier; label: string }[] = [
  { value: "FREE", label: "FREE" },
  { value: "LITE", label: "LITE" },
  { value: "PRO", label: "PRO" },
  { value: "MAX", label: "MAX" },
];

const SOURCE_OPTIONS: { value: MembershipSource; label: string }[] = [
  { value: "MANUAL", label: "手动开通" },
  { value: "GIFT", label: "赠送" },
  { value: "TRIAL", label: "试用" },
];

const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "生效中",
  EXPIRED: "已过期",
  CANCELLED: "已取消",
  SUSPENDED: "已暂停",
};

const TX_TYPE_LABELS: Record<string, string> = {
  GRANT: "发放",
  CONSUME: "消耗",
  ADJUST: "调整",
  REFUND: "退款",
  SIGN_IN: "签到",
  PURCHASE: "购买",
};

const PAGE_SIZE = 10;

type TabKey = "memberships" | "scoin";

interface GrantFormState {
  userId: string;
  tier: MembershipTier;
  durationMonths: number;
  source: MembershipSource;
  note: string;
}

interface AdjustFormState {
  delta: string;
  note: string;
}

const DEFAULT_GRANT_FORM: GrantFormState = {
  userId: "",
  tier: "LITE",
  durationMonths: 1,
  source: "MANUAL",
  note: "",
};

const DEFAULT_ADJUST_FORM: AdjustFormState = {
  delta: "",
  note: "",
};

export default function MembershipsPage() {
  const [tab, setTab] = useState<TabKey>("memberships");

  // 会员列表
  const [users, setUsers] = useState<MembershipUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // S 币流水
  const [txns, setTxns] = useState<SCoinTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txSearch, setTxSearch] = useState("");
  const [txSearchInput, setTxSearchInput] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");

  // 套餐（辅助展示）
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  // 开通会员弹窗
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantUser, setGrantUser] = useState<MembershipUser | null>(null);
  const [grantForm, setGrantForm] = useState<GrantFormState>(DEFAULT_GRANT_FORM);
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState("");

  // 调整 S 币弹窗
  const [adjustUser, setAdjustUser] = useState<MembershipUser | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustFormState>(DEFAULT_ADJUST_FORM);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // ===== 加载会员列表 =====
  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getMemberships({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
      });
      setUsers(res.list);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (tab === "memberships") {
      fetchMemberships();
    }
  }, [fetchMemberships, tab]);

  // ===== 加载 S 币流水 =====
  const fetchTxns = useCallback(async () => {
    setTxLoading(true);
    setTxError("");
    try {
      const res = await adminApi.getSCoinTransactions({
        page: txPage,
        pageSize: PAGE_SIZE,
        search: txSearch || undefined,
      });
      setTxns(res.list);
      setTxTotal(res.total);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setTxLoading(false);
    }
  }, [txPage, txSearch]);

  useEffect(() => {
    if (tab === "scoin") {
      fetchTxns();
    }
  }, [fetchTxns, tab]);

  // ===== 加载套餐 =====
  useEffect(() => {
    adminApi
      .getMembershipPlans()
      .then((res) => setPlans(res.list))
      .catch(() => {
        // 静默失败 - 套餐仅用于辅助展示
      });
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleTxSearch() {
    setTxPage(1);
    setTxSearch(txSearchInput.trim());
  }

  // ===== 开通会员弹窗 =====
  function openGrantFromHeader() {
    setGrantUser(null);
    setGrantForm({ ...DEFAULT_GRANT_FORM });
    setGrantError("");
    setGrantOpen(true);
  }

  function openGrantForRow(user: MembershipUser) {
    setGrantUser(user);
    setGrantForm({
      userId: user.id,
      tier: user.membership?.tier ?? "LITE",
      durationMonths: 1,
      source: "MANUAL",
      note: "",
    });
    setGrantError("");
    setGrantOpen(true);
  }

  function closeGrant() {
    if (granting) return;
    setGrantOpen(false);
    setGrantUser(null);
    setGrantError("");
  }

  async function handleGrant() {
    const userId = grantForm.userId.trim();
    if (!userId) {
      setGrantError("请输入用户 ID");
      return;
    }
    if (
      !Number.isFinite(grantForm.durationMonths) ||
      grantForm.durationMonths < 1 ||
      grantForm.durationMonths > 36
    ) {
      setGrantError("月数需在 1-36 之间");
      return;
    }
    setGranting(true);
    setGrantError("");
    try {
      await adminApi.grantMembership({
        userId,
        tier: grantForm.tier,
        durationMonths: Math.trunc(grantForm.durationMonths),
        source: grantForm.source,
        note: grantForm.note.trim() || undefined,
      });
      setGrantOpen(false);
      setGrantUser(null);
      showToast("会员已开通");
      fetchMemberships();
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : "开通失败");
    } finally {
      setGranting(false);
    }
  }

  // ===== 调整 S 币弹窗 =====
  function openAdjust(user: MembershipUser) {
    setAdjustUser(user);
    setAdjustForm({ ...DEFAULT_ADJUST_FORM });
    setAdjustError("");
  }

  function closeAdjust() {
    if (adjusting) return;
    setAdjustUser(null);
    setAdjustError("");
  }

  async function handleAdjust() {
    if (!adjustUser) return;
    const deltaNum = Number(adjustForm.delta);
    if (!Number.isFinite(deltaNum) || deltaNum === 0) {
      setAdjustError("请输入非零的 S 币变动值");
      return;
    }
    setAdjusting(true);
    setAdjustError("");
    try {
      await adminApi.adjustSCoin({
        userId: adjustUser.id,
        delta: Math.trunc(deltaNum),
        note: adjustForm.note.trim() || undefined,
      });
      setAdjustUser(null);
      showToast("S 币已调整");
      fetchMemberships();
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : "调整失败");
    } finally {
      setAdjusting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const txTotalPages = Math.max(1, Math.ceil(txTotal / PAGE_SIZE));
  const txStart = txTotal === 0 ? 0 : (txPage - 1) * PAGE_SIZE + 1;
  const txEnd = Math.min(txPage * PAGE_SIZE, txTotal);

  function planHint(tier: MembershipTier): string {
    const plan = plans.find((p) => p.tier === tier);
    if (!plan) return "";
    return `¥${plan.priceMonthly}/月 · 每月发放 ${plan.monthlySCoinGrant} S 币`;
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">会员管理</h1>
          <p className="mt-1 text-sm text-ink-500">管理用户会员档位、S 币余额与流水</p>
        </div>
        <button onClick={openGrantFromHeader} className="btn-ink text-sm">
          开通会员
        </button>
      </div>

      {/* Tab 切换 */}
      <div className="glass-card inline-flex gap-1 p-1.5">
        <button
          onClick={() => setTab("memberships")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            tab === "memberships"
              ? "bg-ink-950 text-white shadow-sm"
              : "text-ink-600 hover:bg-ink-100 hover:text-ink-950",
          )}
        >
          会员列表
        </button>
        <button
          onClick={() => setTab("scoin")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            tab === "scoin"
              ? "bg-ink-950 text-white shadow-sm"
              : "text-ink-600 hover:bg-ink-100 hover:text-ink-950",
          )}
        >
          S 币流水
        </button>
      </div>

      {/* ===== Tab: 会员列表 ===== */}
      {tab === "memberships" && (
        <>
          {/* 错误提示 */}
          {error && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* 搜索栏 */}
          <div className="glass-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[260px] flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder="按手机号搜索"
                  className="glass-input w-full py-2 pl-9 pr-3 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>
              <button onClick={handleSearch} className="btn-ink text-sm">
                搜索
              </button>
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                重置
              </button>
              <span className="ml-auto text-sm text-ink-400">共 {total} 位用户</span>
            </div>
          </div>

          {/* 会员表格 */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50/60">
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">手机号</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">姓名</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">当前档位</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">状态</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">到期时间</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">S 币余额</th>
                    <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-ink-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-sm text-ink-400">
                        加载中...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-sm text-ink-400">
                        暂无会员数据
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-ink-50/60">
                        {/* 手机号 */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm text-ink-700">
                            {formatPhone(user.phone)}
                          </span>
                        </td>
                        {/* 姓名 */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-ink-950">
                            {user.name || "未命名"}
                          </span>
                        </td>
                        {/* 当前档位 */}
                        <td className="px-5 py-3.5">
                          <MembershipTierBadge membership={user.membership} />
                        </td>
                        {/* 状态 */}
                        <td className="px-5 py-3.5">
                          <MembershipStatusBadge membership={user.membership} />
                        </td>
                        {/* 到期时间 */}
                        <td className="px-5 py-3.5">
                          {user.membership ? (
                            <span className="text-sm text-ink-600">
                              {formatDate(user.membership.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-sm text-ink-300">—</span>
                          )}
                        </td>
                        {/* S 币余额 */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm font-medium text-ink-950">
                            {user.scoinBalance.toLocaleString()}
                          </span>
                        </td>
                        {/* 操作 */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openGrantForRow(user)}
                              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                            >
                              开通
                            </button>
                            <button
                              onClick={() => openAdjust(user)}
                              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                            >
                              调整 S 币
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="flex items-center justify-between border-t border-ink-200 px-5 py-3.5">
              <p className="text-xs text-ink-400">
                {total > 0 ? `显示 ${start}-${end} 条，共 ${total} 条` : "无数据"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="flex items-center gap-1 rounded-full border border-ink-200 px-3.5 py-1.5 text-sm font-medium text-ink-700 transition-all hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  上一页
                </button>
                <span className="px-2 text-sm text-ink-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="flex items-center gap-1 rounded-full border border-ink-200 px-3.5 py-1.5 text-sm font-medium text-ink-700 transition-all hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  下一页
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== Tab: S 币流水 ===== */}
      {tab === "scoin" && (
        <>
          {/* 错误提示 */}
          {txError && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{txError}</p>
              <button
                onClick={() => setTxError("")}
                className="text-red-400 hover:text-red-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* 搜索栏 */}
          <div className="glass-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[260px] flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={txSearchInput}
                  onChange={(e) => setTxSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTxSearch();
                  }}
                  placeholder="按手机号搜索"
                  className="glass-input w-full py-2 pl-9 pr-3 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>
              <button onClick={handleTxSearch} className="btn-ink text-sm">
                搜索
              </button>
              <button
                onClick={() => {
                  setTxSearchInput("");
                  setTxSearch("");
                  setTxPage(1);
                }}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                重置
              </button>
              <span className="ml-auto text-sm text-ink-400">共 {txTotal} 条流水</span>
            </div>
          </div>

          {/* 流水表格 */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50/60">
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">流水号</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">用户</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">类型</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">变动</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">变动后余额</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">关联</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">备注</th>
                    <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {txLoading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-sm text-ink-400">
                        加载中...
                      </td>
                    </tr>
                  ) : txns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-sm text-ink-400">
                        暂无流水数据
                      </td>
                    </tr>
                  ) : (
                    txns.map((tx) => (
                      <tr key={tx.txId} className="transition-colors hover:bg-ink-50/60">
                        {/* 流水号 */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-ink-500">
                            {tx.txId.length > 10 ? `${tx.txId.slice(0, 10)}…` : tx.txId}
                          </span>
                        </td>
                        {/* 用户 */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm text-ink-700">
                              {formatPhone(tx.userPhone)}
                            </span>
                            {tx.userName && (
                              <span className="text-xs text-ink-400">{tx.userName}</span>
                            )}
                          </div>
                        </td>
                        {/* 类型 */}
                        <td className="px-5 py-3.5">
                          <TxTypeBadge type={tx.type} />
                        </td>
                        {/* 变动 */}
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              "font-mono text-sm font-medium",
                              tx.delta > 0 ? "text-ink-950" : "text-ink-500",
                            )}
                          >
                            {tx.delta > 0 ? "+" : ""}
                            {tx.delta.toLocaleString()}
                          </span>
                        </td>
                        {/* 变动后余额 */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm text-ink-700">
                            {tx.balanceAfter.toLocaleString()}
                          </span>
                        </td>
                        {/* 关联 */}
                        <td className="px-5 py-3.5">
                          {tx.refType ? (
                            <span className="inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-xs text-ink-600">
                              {tx.refType}
                            </span>
                          ) : (
                            <span className="text-sm text-ink-300">—</span>
                          )}
                        </td>
                        {/* 备注 */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-ink-600">
                            {tx.note || "—"}
                          </span>
                        </td>
                        {/* 时间 */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-ink-500">
                            {formatDate(tx.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="flex items-center justify-between border-t border-ink-200 px-5 py-3.5">
              <p className="text-xs text-ink-400">
                {txTotal > 0 ? `显示 ${txStart}-${txEnd} 条，共 ${txTotal} 条` : "无数据"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage <= 1 || txLoading}
                  className="flex items-center gap-1 rounded-full border border-ink-200 px-3.5 py-1.5 text-sm font-medium text-ink-700 transition-all hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  上一页
                </button>
                <span className="px-2 text-sm text-ink-500">
                  {txPage} / {txTotalPages}
                </span>
                <button
                  onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                  disabled={txPage >= txTotalPages || txLoading}
                  className="flex items-center gap-1 rounded-full border border-ink-200 px-3.5 py-1.5 text-sm font-medium text-ink-700 transition-all hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  下一页
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 开通会员弹窗 */}
      {grantOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={closeGrant}
        >
          <div
            className="glass-card-strong m-4 w-full max-w-md p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 18h18" />
                    <path d="M3 8l4.5 4L12 4l4.5 8L21 8l-2 10H5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink-950">开通会员</h2>
                  <p className="text-xs text-ink-400">
                    {grantUser
                      ? `${formatPhone(grantUser.phone)} · ${grantUser.name || "未命名"}`
                      : "为指定用户开通会员档位"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeGrant}
                className="text-ink-400 transition-colors hover:text-ink-950"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 用户 ID */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">用户 ID</label>
                {grantUser ? (
                  <div className="glass-input flex items-center px-3.5 py-2.5">
                    <span className="font-mono text-sm text-ink-700">{grantUser.id}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={grantForm.userId}
                    onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                    placeholder="输入用户 ID（可从用户管理复制）"
                    className="glass-input w-full px-3.5 py-2.5 font-mono text-sm text-ink-950 placeholder:text-ink-400"
                  />
                )}
              </div>

              {/* 档位 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">会员档位</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIER_OPTIONS.map((opt) => {
                    const active = grantForm.tier === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGrantForm({ ...grantForm, tier: opt.value })}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-sm font-medium transition-all",
                          active
                            ? "border-ink-950 bg-ink-950 text-white shadow-sm"
                            : "border-ink-200 bg-white text-ink-600 hover:border-ink-400 hover:bg-ink-50",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {planHint(grantForm.tier) && (
                  <p className="mt-1.5 text-xs text-ink-400">{planHint(grantForm.tier)}</p>
                )}
              </div>

              {/* 月数 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">
                  开通月数（1-36）
                </label>
                <input
                  type="number"
                  min={1}
                  max={36}
                  value={grantForm.durationMonths}
                  onChange={(e) =>
                    setGrantForm({
                      ...grantForm,
                      durationMonths: Number(e.target.value) || 0,
                    })
                  }
                  className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950"
                />
              </div>

              {/* 来源 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">来源</label>
                <select
                  value={grantForm.source}
                  onChange={(e) =>
                    setGrantForm({ ...grantForm, source: e.target.value as MembershipSource })
                  }
                  className="glass-input w-full cursor-pointer px-3.5 py-2.5 text-sm text-ink-950"
                >
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-ink-950">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 备注 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">备注（可选）</label>
                <textarea
                  value={grantForm.note}
                  onChange={(e) => setGrantForm({ ...grantForm, note: e.target.value })}
                  placeholder="备注信息"
                  rows={2}
                  className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>

              {/* 弹窗内错误 */}
              {grantError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{grantError}</p>
              )}
            </div>

            <div className="mt-7 flex justify-end gap-2">
              <button
                onClick={closeGrant}
                disabled={granting}
                className="rounded-full px-5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-40"
              >
                取消
              </button>
              <button onClick={handleGrant} disabled={granting} className="btn-ink text-sm">
                {granting ? "开通中..." : "确认开通"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 调整 S 币弹窗 */}
      {adjustUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={closeAdjust}
        >
          <div
            className="glass-card-strong m-4 w-full max-w-md p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink-950">调整 S 币</h2>
                  <p className="text-xs text-ink-400">
                    {formatPhone(adjustUser.phone)} · 当前余额 {adjustUser.scoinBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAdjust}
                className="text-ink-400 transition-colors hover:text-ink-950"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* delta */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">
                  变动值（正数为增加，负数为扣减）
                </label>
                <input
                  type="number"
                  value={adjustForm.delta}
                  onChange={(e) => setAdjustForm({ ...adjustForm, delta: e.target.value })}
                  placeholder="例如 100 或 -50"
                  className="glass-input w-full px-3.5 py-2.5 font-mono text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">备注（可选）</label>
                <textarea
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  placeholder="调整原因"
                  rows={2}
                  className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>

              {/* 弹窗内错误 */}
              {adjustError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{adjustError}</p>
              )}
            </div>

            <div className="mt-7 flex justify-end gap-2">
              <button
                onClick={closeAdjust}
                disabled={adjusting}
                className="rounded-full px-5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-40"
              >
                取消
              </button>
              <button onClick={handleAdjust} disabled={adjusting} className="btn-ink text-sm">
                {adjusting ? "调整中..." : "确认调整"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/** 档位徽章 - FREE 灰色 / LITE 蓝边 / PRO ink 模拟紫边 / MAX 黑色填充 */
function MembershipTierBadge({ membership }: { membership: MembershipInfo | null }) {
  if (!membership) {
    return (
      <span className="inline-flex items-center rounded-full border border-ink-200 bg-white px-2.5 py-0.5 text-xs font-medium text-ink-400">
        非会员
      </span>
    );
  }
  switch (membership.tier) {
    case "FREE":
      return (
        <span className="inline-flex items-center rounded-full border border-ink-200 bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
          FREE
        </span>
      );
    case "LITE":
      return (
        <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          LITE
        </span>
      );
    case "PRO":
      return (
        <span className="inline-flex items-center rounded-full border-2 border-ink-700 bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-900">
          PRO
        </span>
      );
    case "MAX":
      return <span className="badge-ink">MAX</span>;
  }
}

/** 会员状态徽章 */
function MembershipStatusBadge({ membership }: { membership: MembershipInfo | null }) {
  if (!membership) {
    return <span className="text-sm text-ink-300">—</span>;
  }
  const label = MEMBERSHIP_STATUS_LABELS[membership.status] ?? membership.status;
  if (membership.status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-0.5 text-xs font-medium text-ink-700">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-950" />
        {label}
      </span>
    );
  }
  if (membership.status === "EXPIRED") {
    return (
      <span className="inline-flex items-center rounded-full border border-ink-200 bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-400">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-ink-300 bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
      {label}
    </span>
  );
}

/** 流水类型徽章 */
function TxTypeBadge({ type }: { type: string }) {
  const label = TX_TYPE_LABELS[type] ?? type;
  return (
    <span className="inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-700">
      {label}
    </span>
  );
}
