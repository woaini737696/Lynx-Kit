"use client";

import { useEffect, useState } from "react";

/**
 * 个人资料页 /profile
 * - 拉取当前用户：GET {{API_BASE_URL}}/profile/me
 * - 编辑：PUT {{API_BASE_URL}}/profile
 * - 9 层 Agent 接入照片墙 / 兴趣图谱
 */
const API_BASE_URL = "{{API_BASE_URL}}";

interface Profile {
  id: string;
  nickname: string;
  avatar: string;
  gender: string;
  bio: string;
  interests: string[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/profile/me`)
      .then((r) => r.json())
      .then((p: Profile) => {
        setProfile(p);
        setBio(p.bio ?? "");
      })
      .catch(() =>
        setProfile({
          id: "demo",
          nickname: "示例用户",
          avatar: "",
          gender: "female",
          bio: "这是个人简介占位。",
          interests: ["音乐", "旅行"],
        })
      );
  }, []);

  async function save() {
    await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio }),
    });
    setProfile((p) => (p ? { ...p, bio } : p));
    setEditing(false);
  }

  if (!profile) return <main className="p-6">加载中...</main>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-100">
          {profile.avatar && <img src={profile.avatar} alt="" className="h-full w-full object-cover" />}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{profile.nickname}</h1>
          <p className="text-sm text-gray-500">{profile.gender}</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium">个人简介</h2>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-sm underline"
            style={{ color: "var(--theme)" }}
          >
            {editing ? "取消" : "编辑"}
          </button>
        </div>
        {editing ? (
          <div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              rows={3}
            />
            <button
              onClick={save}
              className="mt-2 rounded-lg px-3 py-1 text-white"
              style={{ background: "var(--theme)" }}
            >
              保存
            </button>
          </div>
        ) : (
          <p className="text-gray-700">{profile.bio}</p>
        )}
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4">
        <h2 className="mb-2 font-medium">兴趣</h2>
        <div className="flex flex-wrap gap-2">
          {profile.interests.map((i) => (
            <span
              key={i}
              className="rounded-full px-3 py-1 text-sm text-white"
              style={{ background: "var(--theme)" }}
            >
              {i}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
