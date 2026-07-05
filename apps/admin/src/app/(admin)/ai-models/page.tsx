"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

/** 单个模型定义 */
interface AiModel {
  id: string;
  name: string;
  enabled: boolean;
  maxTokens?: number;
  pricePer1K?: number;
}

/** provider 配置 value 结构 */
interface AiModelValue {
  provider: string;
  models: AiModel[];
}

/** 后端返回的列表项 */
interface AiModelItem {
  id: string;
  key: string;
  value: AiModelValue;
  updatedAt: string;
}

interface AiModelsResponse {
  list: AiModelItem[];
}

/** 安全解析 value（后端存储为 JSON，结构可能不完整） */
function safeParseValue(raw: unknown): AiModelValue | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const provider = typeof v.provider === "string" ? v.provider : "";
  const models = Array.isArray(v.models) ? v.models.map((m) => {
    const mo = m as Record<string, unknown>;
    return {
      id: typeof mo.id === "string" ? mo.id : "",
      name: typeof mo.name === "string" ? mo.name : "",
      enabled: typeof mo.enabled === "boolean" ? mo.enabled : false,
      maxTokens: typeof mo.maxTokens === "number" ? mo.maxTokens : undefined,
      pricePer1K: typeof mo.pricePer1K === "number" ? mo.pricePer1K : undefined,
    };
  }) : [];
  return { provider, models };
}

/** 默认 JSON 模板，便于新增时填充 */
const DEFAULT_VALUE_TEMPLATE = JSON.stringify(
  {
    provider: "openai",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        enabled: true,
        maxTokens: 128000,
        pricePer1K: 0.005,
      },
    ],
  },
  null,
  2,
);

export default function AiModelsPage() {
  const [items, setItems] = useState<AiModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // 新增弹窗
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState(DEFAULT_VALUE_TEMPLATE);
  const [newKeyError, setNewKeyError] = useState("");
  const [newValueError, setNewValueError] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  // 编辑弹窗
  const [editing, setEditing] = useState<AiModelItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editValueError, setEditValueError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // 删除确认
  const [deleting, setDeleting] = useState<AiModelItem | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getAiModels();
      const data = res as AiModelsResponse;
      setItems(data.list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }

  /** 校验 key：仅字母/数字/下划线/连字符/点，且不含 "ai." 前缀 */
  function validateKey(key: string): string | null {
    const trimmed = key.trim();
    if (!trimmed) return "请输入 Provider Key";
    if (trimmed.startsWith("ai.")) return "无需输入 ai. 前缀，请直接填写 provider 名称";
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) return "仅支持字母、数字、下划线、连字符与点";
    return null;
  }

  /** 校验 value JSON */
  function validateValueJson(json: string): { ok: true; value: AiModelValue } | { ok: false; msg: string } {
    try {
      const parsed = JSON.parse(json);
      const value = safeParseValue(parsed);
      if (!value) return { ok: false, msg: "JSON 结构不正确，需包含 provider 与 models 字段" };
      if (!value.provider) return { ok: false, msg: "缺少 provider 字段" };
      if (!Array.isArray(value.models)) return { ok: false, msg: "models 必须为数组" };
      return { ok: true, value };
    } catch (e) {
      return { ok: false, msg: e instanceof Error ? e.message : "JSON 解析失败" };
    }
  }

  function openCreate() {
    setNewKey("");
    setNewValue(DEFAULT_VALUE_TEMPLATE);
    setNewKeyError("");
    setNewValueError("");
    setCreating(true);
  }

  function closeCreate() {
    setCreating(false);
  }

  async function handleCreate() {
    const keyErr = validateKey(newKey);
    if (keyErr) {
      setNewKeyError(keyErr);
      return;
    }
    const valRes = validateValueJson(newValue);
    if (!valRes.ok) {
      setNewValueError(valRes.msg);
      return;
    }
    setSavingNew(true);
    try {
      await adminApi.updateAiModel(newKey.trim(), valRes.value);
      setCreating(false);
      showToast("Provider 配置已新增");
      fetchModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSavingNew(false);
    }
  }

  function openEdit(item: AiModelItem) {
    setEditing(item);
    setEditValue(JSON.stringify(item.value, null, 2));
    setEditValueError("");
    setSavingEdit(false);
  }

  function closeEdit() {
    setEditing(null);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    const valRes = validateValueJson(editValue);
    if (!valRes.ok) {
      setEditValueError(valRes.msg);
      return;
    }
    setSavingEdit(true);
    try {
      // API 内部会拼接 ai. 前缀，因此这里传去掉 "ai." 的 key
      const apiKey = editing.key.replace(/^ai\./, "");
      await adminApi.updateAiModel(apiKey, valRes.value);
      setEditing(null);
      showToast("Provider 配置已更新");
      fetchModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      const apiKey = deleting.key.replace(/^ai\./, "");
      await adminApi.deleteAiModel(apiKey);
      setDeleting(null);
      showToast("Provider 配置已删除");
      fetchModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">AI 模型管理</h1>
          <p className="mt-1 text-sm text-ink-500">维护各 Provider 的模型清单与启停、参数配置</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-400">共 {items.length} 个 Provider</span>
          <button onClick={openCreate} className="btn-ink inline-flex items-center gap-1.5 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新增 Provider
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600"
            aria-label="关闭错误"
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
        <div className="glass-card p-16 text-center text-sm text-ink-400">加载中...</div>
      ) : items.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
          <p className="text-sm font-medium text-ink-950">暂无 AI 模型配置</p>
          <p className="mt-1 text-xs text-ink-400">点击右上角"新增 Provider"开始配置</p>
          <button onClick={openCreate} className="btn-ink mt-5 text-sm">
            新增 Provider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const value = safeParseValue(item.value);
            const enabledCount = value?.models.filter((m) => m.enabled).length ?? 0;
            const totalCount = value?.models.length ?? 0;
            return (
              <div key={item.id} className="glass-card flex flex-col p-5">
                {/* 卡头 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-ink-950">
                        {value?.provider || "未命名 Provider"}
                      </h2>
                      <span className="badge-ink flex-shrink-0">{totalCount} 模型</span>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-ink-400">{item.key}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setDeleting(item)}
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* 启用统计 */}
                <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {enabledCount} 启用
                  </span>
                  <span className="text-ink-300">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-300" />
                    {totalCount - enabledCount} 禁用
                  </span>
                </div>

                {/* 模型列表 */}
                <div className="mt-4 flex-1">
                  {!value || totalCount === 0 ? (
                    <p className="py-6 text-center text-xs text-ink-400">暂无模型</p>
                  ) : (
                    <ul className="space-y-2">
                      {value.models.map((m) => (
                        <li
                          key={m.id}
                          className="rounded-lg border border-ink-200 bg-white/40 px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={
                                  "h-2 w-2 flex-shrink-0 rounded-full " +
                                  (m.enabled ? "bg-emerald-500" : "bg-ink-300")
                                }
                                title={m.enabled ? "已启用" : "已禁用"}
                              />
                              <span className="truncate text-sm font-medium text-ink-950">
                                {m.name || m.id || "未命名模型"}
                              </span>
                            </div>
                            <span
                              className={
                                "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium " +
                                (m.enabled
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-ink-100 text-ink-500")
                              }
                            >
                              {m.enabled ? "启用" : "禁用"}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 pl-4 text-[11px] text-ink-500">
                            <span className="font-mono">{m.id || "—"}</span>
                            {typeof m.maxTokens === "number" && (
                              <span>上限 {m.maxTokens.toLocaleString()} tokens</span>
                            )}
                            {typeof m.pricePer1K === "number" && (
                              <span>${m.pricePer1K.toFixed(4)} / 1K</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 更新时间 */}
                <div className="mt-4 border-t border-ink-200 pt-3 text-xs text-ink-400">
                  更新于 {formatDate(item.updatedAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 新增 Provider 弹窗 */}
      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={() => !savingNew && closeCreate()}
        >
          <div
            className="glass-card-strong m-4 flex max-h-[90vh] w-full max-w-lg flex-col p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink-950">新增 Provider 配置</h2>
                  <p className="text-xs text-ink-400">填写 key 与 value JSON，API 将自动拼接 ai. 前缀</p>
                </div>
              </div>
              <button
                onClick={closeCreate}
                disabled={savingNew}
                className="text-ink-400 transition-colors hover:text-ink-950 disabled:opacity-40"
                aria-label="关闭"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {/* Key */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">
                  Provider Key
                </label>
                <div className="flex items-center">
                  <span className="flex-shrink-0 rounded-l-lg border border-r-0 border-ink-200 bg-ink-100 px-3 py-2.5 font-mono text-xs text-ink-500">
                    ai.
                  </span>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => {
                      setNewKey(e.target.value);
                      setNewKeyError("");
                    }}
                    placeholder="openai / zhipu / anthropic"
                    className="glass-input w-full flex-1 rounded-l-none px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                  />
                </div>
                {newKeyError && <p className="mt-1.5 text-xs text-red-500">{newKeyError}</p>}
              </div>

              {/* Value JSON */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">
                  Value JSON
                </label>
                <textarea
                  value={newValue}
                  onChange={(e) => {
                    setNewValue(e.target.value);
                    setNewValueError("");
                  }}
                  rows={14}
                  spellCheck={false}
                  className="glass-input w-full px-3.5 py-2.5 font-mono text-xs leading-relaxed text-ink-950"
                  placeholder='{ "provider": "...", "models": [...] }'
                />
                {newValueError && <p className="mt-1.5 text-xs text-red-500">{newValueError}</p>}
                <p className="mt-1.5 text-[11px] text-ink-400">
                  结构：{`{ provider: string, models: [{ id, name, enabled, maxTokens?, pricePer1K? }] }`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeCreate}
                disabled={savingNew}
                className="rounded-full px-5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-40"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={savingNew}
                className="btn-ink text-sm"
              >
                {savingNew ? "保存中..." : "保存配置"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑 Provider 弹窗 */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={() => !savingEdit && closeEdit()}
        >
          <div
            className="glass-card-strong m-4 flex max-h-[90vh] w-full max-w-lg flex-col p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink-950">编辑 Provider 配置</h2>
                  <p className="font-mono text-xs text-ink-400">{editing.key}</p>
                </div>
              </div>
              <button
                onClick={closeEdit}
                disabled={savingEdit}
                className="text-ink-400 transition-colors hover:text-ink-950 disabled:opacity-40"
                aria-label="关闭"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">
                  Provider 名称（只读）
                </label>
                <input
                  type="text"
                  value={editing.value?.provider ?? ""}
                  readOnly
                  className="glass-input w-full cursor-not-allowed px-3.5 py-2.5 text-sm text-ink-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">
                  Value JSON
                </label>
                <textarea
                  value={editValue}
                  onChange={(e) => {
                    setEditValue(e.target.value);
                    setEditValueError("");
                  }}
                  rows={16}
                  spellCheck={false}
                  className="glass-input w-full px-3.5 py-2.5 font-mono text-xs leading-relaxed text-ink-950"
                />
                {editValueError && <p className="mt-1.5 text-xs text-red-500">{editValueError}</p>}
                <p className="mt-1.5 text-[11px] text-ink-400">
                  结构：{`{ provider: string, models: [{ id, name, enabled, maxTokens?, pricePer1K? }] }`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeEdit}
                disabled={savingEdit}
                className="rounded-full px-5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-40"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="btn-ink text-sm"
              >
                {savingEdit ? "保存中..." : "保存配置"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={() => !deletingLoading && setDeleting(null)}
        >
          <div
            className="glass-card-strong m-4 w-full max-w-sm p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-700">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h2 className="text-center text-base font-semibold text-ink-950">删除 Provider 配置</h2>
            <p className="mt-2 text-center text-sm text-ink-500">
              确定要删除
              <span className="mx-1 font-medium text-ink-950">
                {deleting.value?.provider ?? deleting.key}
              </span>
              吗？该操作不可恢复，相关模型将立即下线。
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setDeleting(null)}
                disabled={deletingLoading}
                className="flex-1 rounded-full border border-ink-200 px-5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 disabled:opacity-40"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingLoading}
                className="flex-1 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-40"
              >
                {deletingLoading ? "删除中..." : "确认删除"}
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
