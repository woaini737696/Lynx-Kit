"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await adminApi.login(phone, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-ink-50 to-white">
      {/* 网格底纹 */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo + 标题 */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-950 text-white shadow-lg">
              <span className="text-xl font-semibold tracking-tight">妙</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-950">
              妙想运营后台
            </h1>
            <p className="mt-2 text-sm text-ink-500">MiaoX Admin Console</p>
          </div>

          {/* 登录卡片 */}
          <form onSubmit={handleSubmit} className="glass-card space-y-5 p-7">
            {/* 手机号 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700">手机号</label>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-ink-100 px-3 py-2.5 text-sm font-medium text-ink-600">
                  +86
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="glass-input flex-1 px-4 py-2.5 text-sm text-ink-950 placeholder:text-ink-400"
                  required
                  maxLength={11}
                  pattern="^1[3-9]\d{9}$"
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="glass-input w-full px-4 py-2.5 pr-11 text-sm text-ink-950 placeholder:text-ink-400"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 提交 */}
            <button
              type="submit"
              disabled={loading || !phone || !password}
              className="btn-ink w-full"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          {/* 页脚 */}
          <p className="mt-8 text-center text-xs text-ink-400">
            © 2026 妙想 · 运营后台 · 仅限授权访问
          </p>
        </div>
      </div>
    </div>
  );
}
