"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 登录页
 * - 默认走手机号 + 验证码（由 questions.user_identity 配置决定）
 * - 调用 POST {{API_BASE_URL}}/auth/login
 */
const API_BASE_URL = "{{API_BASE_URL}}";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    await fetch(`${API_BASE_URL}/auth/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/discover");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={onLogin}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold">登录 {{APP_NAME}}</h1>
        <div>
          <label className="block text-sm text-gray-600">手机号</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="13800138000"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2"
            placeholder="验证码"
          />
          <button
            type="button"
            onClick={sendCode}
            className="rounded-lg px-3 py-2 text-sm text-white"
            style={{ background: "var(--theme)" }}
          >
            发送
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2 text-white disabled:opacity-50"
          style={{ background: "var(--theme)" }}
        >
          {loading ? "登录中..." : "登录"}
        </button>
        <p className="text-center text-sm text-gray-500">
          没有账号？<a href="/register" className="underline">注册</a>
        </p>
      </form>
    </main>
  );
}
