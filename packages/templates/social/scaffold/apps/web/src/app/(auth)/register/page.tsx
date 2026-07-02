"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 注册页
 * - 收集手机号 / 昵称 / 性别 / 兴趣
 * - 兴趣在注册后生成 embedding 写入 users.embedding
 */
const API_BASE_URL = "{{API_BASE_URL}}";

const INTEREST_OPTIONS = ["音乐", "电影", "旅行", "美食", "运动", "阅读", "游戏", "摄影"];

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("female");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleInterest(i: string) {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, nickname, gender, interests }),
    });
    setLoading(false);
    if (res.ok) router.push("/discover");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={onRegister}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold">创建账号</h1>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="手机号"
        />
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="昵称"
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="female">女</option>
          <option value="male">男</option>
          <option value="other">其他</option>
        </select>
        <div>
          <p className="mb-2 text-sm text-gray-600">兴趣（多选）</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((i) => {
              const active = interests.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleInterest(i)}
                  className="rounded-full border px-3 py-1 text-sm"
                  style={
                    active
                      ? { background: "var(--theme)", color: "#fff", borderColor: "var(--theme)" }
                      : undefined
                  }
                >
                  {i}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2 text-white disabled:opacity-50"
          style={{ background: "var(--theme)" }}
        >
          {loading ? "注册中..." : "完成注册"}
        </button>
      </form>
    </main>
  );
}
