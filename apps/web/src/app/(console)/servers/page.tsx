"use client";

import Link from "next/link";
import { Plus, Server as ServerIcon } from "lucide-react";

import { trpc } from "@/lib/trpc";
import type { Server as ServerType } from "@lynxkit/shared";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServerCard } from "@/components/server/server-card";

export default function ServersPage() {
  const { data, isLoading } = trpc.server.list.useQuery({});
  const servers = (data?.items ?? []) as ServerType[];

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">服务器</h1>
          <p className="mt-1 text-sm text-zinc-500">
            管理用于部署的服务器资源
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          添加服务器
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部服务器 ({servers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              加载中...
            </p>
          ) : servers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ServerIcon className="h-12 w-12 text-zinc-300" />
              <p className="text-sm text-zinc-500">
                还没有添加服务器，部署前需要先添加一台
              </p>
              <Button>
                <Plus className="h-4 w-4" />
                添加第一台服务器
              </Button>
              <Link
                href="/console"
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                返回控制台
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {servers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
