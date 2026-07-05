"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

interface RoleDef {
  key: string;
  name: string;
  description: string;
  permissions: string[];
}

interface RolesResp {
  roles: RoleDef[];
}

const roleColors: Record<string, string> = {
  USER: "bg-ink-200 text-ink-700",
  CREATOR: "bg-ink-300 text-ink-800",
  ADMIN: "bg-ink-800 text-white",
  SUPER_ADMIN: "bg-ink-950 text-white",
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getRoles()
      .then((data) => setRoles((data as RolesResp).roles))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-ink-400">加载中...</div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950">角色管理</h1>
        <p className="mt-1 text-sm text-ink-500">平台角色定义与权限矩阵</p>
      </div>

      {/* 角色卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <div key={role.key} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-ink-950">{role.name}</h3>
                <p className="mt-0.5 text-xs text-ink-400">{role.key}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${roleColors[role.key] ?? "bg-ink-200 text-ink-700"}`}
              >
                {role.key}
              </span>
            </div>

            <p className="mt-3 text-sm text-ink-600">{role.description}</p>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-ink-500">
                权限（{role.permissions.length} 项）
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="rounded-md bg-ink-100 px-2 py-1 text-xs font-mono text-ink-600"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 权限矩阵说明 */}
      <div className="glass-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-950">权限说明</h2>
        <div className="space-y-2 text-sm text-ink-600">
          <div className="flex gap-3">
            <span className="badge-ink shrink-0">store:view</span>
            <span>浏览商店</span>
          </div>
          <div className="flex gap-3">
            <span className="badge-ink shrink-0">build:create</span>
            <span>创建构建会话</span>
          </div>
          <div className="flex gap-3">
            <span className="badge-ink shrink-0">store:publish</span>
            <span>发布产品到商店</span>
          </div>
          <div className="flex gap-3">
            <span className="badge-ink shrink-0">admin:access</span>
            <span>访问运营后台</span>
          </div>
          <div className="flex gap-3">
            <span className="badge-ink shrink-0">user:manage</span>
            <span>管理用户（查看/编辑/封禁）</span>
          </div>
          <div className="flex gap-3">
            <span className="badge-ink shrink-0">config:manage</span>
            <span>管理系统配置</span>
          </div>
          <div className="flex gap-3">
            <span className="badge-ink shrink-0">*</span>
            <span>全部权限（仅 SUPER_ADMIN）</span>
          </div>
        </div>
      </div>
    </div>
  );
}
