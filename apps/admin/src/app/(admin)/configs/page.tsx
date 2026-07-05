"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

/** 后端返回的系统配置项 */
interface Config {
  id: string;
  key: string;
  value: unknown;
  updatedAt: string;
}

interface ConfigsResponse {
  list: Config[];
}

/** JSON 语法高亮的 Token 类型 */
type JsonToken =
  | { type: "key"; value: string }
  | { type: "string"; value: string }
  | { type: "number"; value: string }
  | { type: "boolean"; value: string }
  | { type: "null"; value: string }
  | { type: "punct"; value: string }
  | { type: "ws"; value: string };

/** 将 JSON 字符串切分为带类型的 Token，用于着色渲染 */
function tokenizeJson(json: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  const len = json.length;
  let i = 0;
  while (i < len) {
    const ch = json[i]!;
    if (ch === '"') {
      let end = i + 1;
      while (end < len) {
        if (json[end] === "\\") {
          end += 2;
          continue;
        }
        if (json[end] === '"') {
          end++;
          break;
        }
        end++;
      }
      const str = json.slice(i, end);
      let j = end;
      while (j < len && /\s/.test(json[j]!)) j++;
      tokens.push({ type: json[j] === ":" ? "key" : "string", value: str });
      i = end;
    } else if (ch === "-" || (ch >= "0" && ch <= "9")) {
      let end = i + 1;
      while (end < len && /[0-9.eE+\-]/.test(json[end]!)) end++;
      tokens.push({ type: "number", value: json.slice(i, end) });
      i = end;
    } else if (json.startsWith("true", i)) {
      tokens.push({ type: "boolean", value: "true" });
      i += 4;
    } else if (json.startsWith("false", i)) {
      tokens.push({ type: "boolean", value: "false" });
      i += 5;
    } else if (json.startsWith("null", i)) {
      tokens.push({ type: "null", value: "null" });
      i += 4;
    } else if (ch === "{" || ch === "}" || ch === "[" || ch === "]" || ch === ":" || ch === ",") {
      tokens.push({ type: "punct", value: ch });
      i++;
    } else {
      let end = i;
      while (end < len && /\s/.test(json[end]!)) end++;
      if (end === i) end = i + 1;
      tokens.push({ type: "ws", value: json.slice(i, end) });
      i = end;
    }
  }
  return tokens;
}

const TOKEN_COLOR: Record<JsonToken["type"], string> = {
  key: "text-ink-500",
  string: "text-emerald-600",
  number: "text-blue-600",
  boolean: "text-amber-600",
  null: "text-amber-600",
  punct: "text-ink-400",
  ws: "text-ink-700",
};

/** 将任意 JSON 值渲染为带语法高亮的 React 节点 */
function renderJson(value: unknown): React.ReactNode {
  let json: string;
  try {
    json = JSON.stringify(value, null, 2);
  } catch {
    json = String(value);
  }
  if (!json) return <span className="text-ink-400">—</span>;
  return tokenizeJson(json).map((tok, i) => (
    <span key={i} className={TOKEN_COLOR[tok.type]}>
      {tok.value}
    </span>
  ));
}

/** 校验 JSON 文本，成功返回解析后的值，失败返回 null */
function parseJson(text: string): { value: unknown | null; error: string | null } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { value: null, error: "请输入 JSON 值" };
  }
  try {
    return { value: JSON.parse(trimmed), error: null };
  } catch (err) {
    return { value: null, error: err instanceof Error ? err.message : "JSON 解析失败" };
  }
}

export default function ConfigsPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // 新增/编辑弹窗（统一处理 upsert）
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [modalKey, setModalKey] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  // 删除确认
  const [deletingConfig, setDeletingConfig] = useState<Config | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getConfigs();
      setConfigs((res as ConfigsResponse).list ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }

  function openCreate() {
    setModalMode("create");
    setModalKey("");
    setModalValue("");
    setModalError("");
  }

  function openEdit(config: Config) {
    setModalMode("edit");
    setModalKey(config.key);
    setModalValue(JSON.stringify(config.value, null, 2));
    setModalError("");
  }

  function closeModal() {
    setModalMode(null);
    setModalKey("");
    setModalValue("");
    setModalError("");
  }

  /** 实时校验，返回错误信息（无错返回空串） */
  function validate(): string {
    if (modalMode === "create") {
      const key = modalKey.trim();
      if (!key) return "请输入配置键";
      if (!/^[a-zA-Z0-9_.\-]+$/.test(key)) {
        return "配置键只能包含字母、数字、下划线、点、连字符";
      }
    }
    const { error } = parseJson(modalValue);
    return error ?? "";
  }

  function handleFormat() {
    const { value, error } = parseJson(modalValue);
    if (error) {
      setModalError(error);
      return;
    }
    setModalValue(JSON.stringify(value, null, 2));
    setModalError("");
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      setModalError(err);
      return;
    }
    const key = modalKey.trim();
    const { value } = parseJson(modalValue);
    setSaving(true);
    setModalError("");
    try {
      await adminApi.updateConfig(key, value);
      const isCreate = modalMode === "create";
      closeModal();
      showToast(isCreate ? "配置已新增" : "配置已更新");
      fetchConfigs();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingConfig) return;
    setDeleting(true);
    try {
      await adminApi.deleteConfig(deletingConfig.key);
      setDeletingConfig(null);
      showToast("配置已删除");
      fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  }

  // 实时校验错误（不阻塞输入）
  const liveError = modalMode ? validate() : "";
  const isInvalid = !!liveError;

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">系统配置</h1>
          <p className="mt-1 text-sm text-ink-500">管理平台运行参数与开关</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-400">共 {configs.length} 项</span>
          <button onClick={openCreate} className="btn-ink text-sm">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新增配置
            </span>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* 配置表格 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/60">
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">配置键</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">值</th>
                <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-ink-500">更新时间</th>
                <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-ink-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-sm text-ink-400">
                    加载中...
                  </td>
                </tr>
              ) : configs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-sm text-ink-400">
                    暂无配置数据
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr key={config.id} className="align-top transition-colors hover:bg-ink-50/60">
                    {/* 配置键 */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-medium text-ink-950 break-all">
                        {config.key}
                      </span>
                    </td>
                    {/* 值（JSON 美化 + 语法高亮） */}
                    <td className="px-5 py-3.5">
                      <pre className="font-mono text-xs leading-relaxed max-h-32 overflow-auto whitespace-pre-wrap break-all">
                        {renderJson(config.value)}
                      </pre>
                    </td>
                    {/* 更新时间 */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-600">
                        {config.updatedAt ? formatDate(config.updatedAt) : "—"}
                      </span>
                    </td>
                    {/* 操作 */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(config)}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => setDeletingConfig(config)}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={closeModal}
        >
          <div
            className="glass-card-strong m-4 w-full max-w-xl p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink-950">
                    {modalMode === "create" ? "新增配置" : "编辑配置"}
                  </h2>
                  <p className="text-xs text-ink-400">
                    {modalMode === "create" ? "填写键名与 JSON 值后提交" : "修改 JSON 值后保存"}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-ink-400 transition-colors hover:text-ink-950">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 配置键 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-600">配置键</label>
                <input
                  type="text"
                  value={modalKey}
                  onChange={(e) => setModalKey(e.target.value)}
                  disabled={modalMode === "edit"}
                  placeholder="如 platform.fee.rate"
                  className="glass-input w-full px-3.5 py-2.5 font-mono text-sm text-ink-950 placeholder:text-ink-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="mt-1 text-[11px] text-ink-400">
                  支持字母、数字、下划线、点、连字符（编辑模式不可修改）
                </p>
              </div>

              {/* JSON 值编辑器 */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-ink-600">JSON 值</label>
                  <button
                    onClick={handleFormat}
                    type="button"
                    className="rounded-md px-2 py-0.5 text-[11px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-950"
                  >
                    格式化
                  </button>
                </div>
                <textarea
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const ta = e.currentTarget;
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const next = modalValue.slice(0, start) + "  " + modalValue.slice(end);
                      setModalValue(next);
                      requestAnimationFrame(() => {
                        ta.selectionStart = ta.selectionEnd = start + 2;
                      });
                    }
                  }}
                  spellCheck={false}
                  rows={10}
                  placeholder={'{\n  "enabled": true,\n  "rate": 0.05\n}'}
                  className="glass-input w-full resize-y px-3.5 py-2.5 font-mono text-xs leading-relaxed text-ink-950 placeholder:text-ink-400"
                />
                {/* 实时校验提示 */}
                <div className="mt-1.5 min-h-[16px]">
                  {liveError ? (
                    <p className="text-[11px] text-red-600">
                      <span className="font-mono">✗</span> {liveError}
                    </p>
                  ) : modalValue.trim() ? (
                    <p className="text-[11px] text-emerald-600">
                      <span className="font-mono">✓</span> JSON 格式正确
                    </p>
                  ) : null}
                </div>
                {modalError && (
                  <p className="mt-1 text-xs text-red-600">{modalError}</p>
                )}
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-full px-5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || isInvalid}
                className="btn-ink text-sm"
              >
                {saving ? "保存中..." : modalMode === "create" ? "新增" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deletingConfig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[40px]"
          onClick={() => !deleting && setDeletingConfig(null)}
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
            <h2 className="text-center text-base font-semibold text-ink-950">删除配置</h2>
            <p className="mt-2 text-center text-sm text-ink-500">
              确定要删除配置
              <span className="mx-1 font-mono font-medium text-ink-950 break-all">
                {deletingConfig.key}
              </span>
              吗？该操作不可撤销。
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setDeletingConfig(null)}
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
