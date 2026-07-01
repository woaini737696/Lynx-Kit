"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  FolderGit2,
  Server as ServerIcon,
  Rocket,
  ArrowRight,
} from "lucide-react";

import { trpc } from "@/lib/trpc";
import type { Project } from "@lynxkit/shared";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectCard } from "@/components/project/project-card";

export default function ConsoleHomePage() {
  // 拉取项目与服务器列表
  const projectsQuery = trpc.project.list.useQuery({});
  const serversQuery = trpc.server.list.useQuery({});

  const projects = (projectsQuery.data?.items ?? []) as Project[];
  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [projects]
  );

  const stats = [
    {
      label: "项目数",
      value: projects.length,
      icon: FolderGit2,
      color: "text-lynx-600 bg-lynx-50",
    },
    {
      label: "服务器数",
      value: serversQuery.data?.items?.length ?? 0,
      icon: ServerIcon,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "已部署",
      value: projects.filter((p) => p.status === "deployed").length,
      icon: Rocket,
      color: "text-green-600 bg-green-50",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* 欢迎卡片 */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-lynx-500 to-lynx-600 text-white">
        <CardContent className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold">欢迎使用 LynxKit 👋</h1>
            <p className="mt-1 text-white/80">
              从一个想法开始，几分钟后你的产品就能上线。
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/console/projects/new">
              新建项目
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* 数据统计 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-zinc-500">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-zinc-900">
                    {stat.value}
                  </p>
                </div>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 最近项目 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>最近项目</CardTitle>
          <Link
            href="/console/projects"
            className="text-sm font-medium text-lynx-600 hover:text-lynx-700"
          >
            查看全部
          </Link>
        </CardHeader>
        <CardContent>
          {projectsQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              加载中...
            </p>
          ) : recentProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FolderGit2 className="h-10 w-10 text-zinc-300" />
              <p className="text-sm text-zinc-500">还没有项目，快来创建第一个吧</p>
              <Button asChild>
                <Link href="/console/projects/new">立即创建</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
