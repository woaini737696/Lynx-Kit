"use client";

import Link from "next/link";
import { Plus, FolderGit2 } from "lucide-react";

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

export default function ProjectsPage() {
  const { data, isLoading } = trpc.project.list.useQuery({});
  const projects = (data?.items ?? []) as Project[];

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">项目</h1>
          <p className="mt-1 text-sm text-zinc-500">
            管理你的全部产品项目
          </p>
        </div>
        <Button asChild>
          <Link href="/console/projects/new">
            <Plus className="h-4 w-4" />
            新建项目
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部项目 ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              加载中...
            </p>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FolderGit2 className="h-12 w-12 text-zinc-300" />
              <p className="text-sm text-zinc-500">还没有任何项目</p>
              <Button asChild>
                <Link href="/console/projects/new">
                  <Plus className="h-4 w-4" />
                  创建第一个项目
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
