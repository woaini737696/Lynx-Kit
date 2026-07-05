"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

/** Agent 配置项数据结构 */
interface AgentValue {
  name: string;
  description?: string;
  enabled: boolean;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxSteps?: number;
}

interface AgentRow {
  id: string;
  key: string;
  value: AgentValue;
  updatedAt: string;
}

interface AgentForm {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  model: string;
  systemPrompt: string;
  temperature: string;
  maxSteps: string;
}

const MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "claude-sonnet-4", label: "Claude Sonnet 4" },
  { value: "claude-opus-4", label: "Claude Opus 4" },
  { value: "deepseek-chat", label: "DeepSeek Chat" },
  { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
  { value: "qwen-max", label: "Qwen Max" },
];

const EMPTY_FORM: AgentForm = {
  key: "",
  name: "",
  description: "",
  enabled: true,
  model: "gpt-4o",
  systemPrompt: "",
  temperature: "0.7",
  maxSteps: "10",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // 编辑/新增弹窗
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; agent?: AgentRow } | null>(null);
  const [form, setForm] = useState<AgentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // 删除确认
  const [deletingAgent, setDeletingAgent] = useState<AgentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getAgents() as { list: AgentRow[] };
      setAgents(res.list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }

  function openCreate() {
    setEditing({ mode: "create" });
    setForm(EMPTY_FORM);
  }

  function openEdit(agent: AgentRow) {
    const v = agent.value ?? ({} as AgentValue);
    setEditing({ mode: "edit", agent });
    setForm({
      key: agent.key.replace(/^agent\./, ""),
      name: v.name ?? "",
      description: v.description ?? "",
      enabled: v.enabled ?? false,
      model: v.model ?? "gpt-4o",
      systemPrompt: v.systemPrompt ?? "",
      temperature: v.temperature != null ? String(v.temperature) : "0.7",
      maxSteps: v.maxSteps != null ? String(v.maxSteps) : "10",
    });
  }

  function closeEdit() {
    setEditing(null);
  }

  async function handleSave() {
    if (!editing) return;
    const key = form.key.trim();
    if (!key) {
      setError("请填写 Agent 标识");
      return;
    }
    if (!form.name.trim()) {
      setError("请填写 Agent 名称");
      return;
    }

    const temperature = parseFloat(form.temperature);
    const maxSteps = parseInt(form.maxSteps, 10);

    setSaving(true);
    setError("");
    try {
      const value: AgentValue = {
        name: form.name.trim(),
        description: form.description.trim(),
        enabled: form.enabled,
        model: form.model,
        systemPrompt: form.systemPrompt,
        temperature: Number.isFinite(temperature) ? temperature : 0.7,
        maxSteps: Number.isFinite(maxSteps) ? maxSteps : 10,
      };
      await adminApi.updateAgent(key, value);
      setEditing(null);
      showToast(editing.mode === "create" ? "Agent 已创建" : "Agent 已更新");
      fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingAgent) return;
    setDeleting(true);
    try {
      await adminApi.deleteAgent(deletingAgent.key.replace(/^agent\./, ""));
      setDeletingAgent(null);
      showToast("Agent 已删除");
      fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Agent 管理</h1>
          <p className="mt-1 text-sm text-ink-500">管理妙想运营后台的智能体配置</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-400">共 {agents.length} 个 Agent</span>
          <button onClick={openCreate} className="btn-ink text-sm">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新增 Agent
            </span>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-400 transition-colors hover:text-red-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* 卡片网格 */}
      {loading ? (
        <div className="glass-card px-6 py-20 text-center text-sm text-ink-400">
          加载中...
        </div>
      ) : agents.length === 0 ? (
        <div className="glass-card px-6 py-20 text-center">
          <p className="text-sm text-ink-400">暂无 Agent 配置</p>
          <button
            onClick={openCreate}
            className="btn-ink mt-4 text-sm"
          >
            新增第一个 Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => openEdit(agent)}
              onDelete={() => setDeletingAgent(agent)}
            />
          ))}
        </div>
      )}

      {/* 编辑/新增弹窗 */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px] p-4"
          onClick={closeEdit}
        >
          <div
            className="glass-card-strong w-full max-w-lg max-h-[90vh] overflow-y-auto p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink-950">
                    {editing.mode === "create" ? "新增 Agent" : "编辑 Agent"}
                  </h2>
                  <p className="text-xs text-ink-400">
                    {editing.mode === "create" ? "创建新的智能体配置" : "修改智能体配置"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEdit}
                className="text-ink-400 transition-colors hover:text-ink-950"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 标识 key */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">
                  标识 key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="如 intent / architect / frontend"
                  disabled={editing.mode === "edit"}
                  className={cn(
                    "glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400",
                    editing.mode === "edit" && "cursor-not-allowed opacity-60",
                  )}
                />
                <p className="mt-1 text-[11px] text-ink-400">
                  存储为 agent.{form.key || "<key>"}，创建后不可修改
                </p>
              </div>

              {/* 名称 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">
                  名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如 意图识别 Agent"
                  className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">描述</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="简短描述 Agent 的能力"
                  className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                />
              </div>

              {/* 模型 + 启用状态 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-600">模型</label>
                  <select
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="glass-input w-full cursor-pointer px-3.5 py-2.5 text-sm text-ink-950"
                  >
                    {MODEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white text-ink-950">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-600">启用状态</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, enabled: !form.enabled })}
                    className={cn(
                      "glass-input flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition-colors",
                      form.enabled ? "text-ink-950" : "text-ink-400",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          form.enabled ? "bg-emerald-500" : "bg-ink-400",
                        )}
                      />
                      {form.enabled ? "已启用" : "已禁用"}
                    </span>
                    <span
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        form.enabled ? "bg-ink-950" : "bg-ink-200",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                          form.enabled ? "left-[18px]" : "left-0.5",
                        )}
                      />
                    </span>
                  </button>
                </div>
              </div>

              {/* 温度 + 最大步数 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-600">温度</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                    placeholder="0.7"
                    className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-600">最大步数</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={form.maxSteps}
                    onChange={(e) => setForm({ ...form, maxSteps: e.target.value })}
                    placeholder="10"
                    className="glass-input w-full px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                  />
                </div>
              </div>

              {/* 系统提示词 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">系统提示词</label>
                <textarea
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  placeholder="请输入 system prompt..."
                  rows={6}
                  className="glass-input w-full resize-y px-3.5 py-2.5 text-sm leading-relaxed text-ink-950 placeholder:text-ink-400"
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-2">
              <button
                onClick={closeEdit}
                className="rounded-full px-5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-ink text-sm"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deletingAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px] p-4"
          onClick={() => !deleting && setDeletingAgent(null)}
        >
          <div
            className="glass-card-strong w-full max-w-sm p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-700">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h2 className="text-center text-base font-semibold text-ink-950">删除 Agent</h2>
            <p className="mt-2 text-center text-sm text-ink-500">
              确定要删除 Agent
              <span className="mx-1 font-medium text-ink-950">
                {deletingAgent.value?.name || deletingAgent.key}
              </span>
              吗？此操作不可恢复。
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setDeletingAgent(null)}
                disabled={deleting}
                className="flex-1 rounded-full border border-ink-200 px-5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 disabled:opacity-40"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? "删除中..." : "确认删除"}
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

/** Agent 卡片 */
function AgentCard({
  agent,
  onEdit,
  onDelete,
}: {
  agent: AgentRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const v = agent.value ?? ({} as AgentValue);
  const shortKey = agent.key.replace(/^agent\./, "");

  return (
    <div className="glass-card flex flex-col p-5">
      {/* 顶部：状态点 + 名称 + 操作 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
              v.enabled ? "bg-emerald-500" : "bg-ink-400",
            )}
          />
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-ink-950">
              {v.name || shortKey}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-ink-400">
              agent.{shortKey}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-950"
            aria-label="编辑"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="删除"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 描述 */}
      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-ink-600">
        {v.description || "暂无描述"}
      </p>

      {/* 元信息 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {v.enabled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            已启用
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-500">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
            已禁用
          </span>
        )}
        {v.model && (
          <span className="badge-ink">{v.model}</span>
        )}
      </div>

      {/* 参数 */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-ink-200/60 pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-400">温度</p>
          <p className="mt-0.5 text-sm font-medium text-ink-950">
            {v.temperature != null ? v.temperature : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-400">最大步数</p>
          <p className="mt-0.5 text-sm font-medium text-ink-950">
            {v.maxSteps != null ? v.maxSteps : "—"}
          </p>
        </div>
      </div>

      {/* 底部：更新时间 */}
      <div className="mt-4 flex items-center justify-between border-t border-ink-200/60 pt-3">
        <span className="text-[11px] text-ink-400">
          {agent.updatedAt ? `更新于 ${formatDate(agent.updatedAt)}` : "未更新"}
        </span>
        <button
          onClick={onEdit}
          className="text-xs font-medium text-ink-600 transition-colors hover:text-ink-950"
        >
          查看详情 →
        </button>
      </div>
    </div>
  );
}
