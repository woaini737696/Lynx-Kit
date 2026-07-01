import Link from "next/link";
import { MoreVertical } from "lucide-react";

import type { Project } from "@lynxkit/shared";
import { formatRelativeTime, getProductTypeMeta } from "@lynxkit/shared";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 项目状态对应的徽章样式
const STATUS_VARIANT: Record<
  Project["status"],
  { label: string; className: string }
> = {
  draft: { label: "草稿", className: "bg-zinc-100 text-zinc-700" },
  clarifying: { label: "需求澄清中", className: "bg-blue-100 text-blue-700" },
  generating: { label: "代码生成中", className: "bg-amber-100 text-amber-700" },
  building: { label: "编译中", className: "bg-purple-100 text-purple-700" },
  deploying: { label: "部署中", className: "bg-cyan-100 text-cyan-700" },
  deployed: { label: "已部署", className: "bg-green-100 text-green-700" },
  error: { label: "错误", className: "bg-red-100 text-red-700" },
};

export function ProjectCard({ project }: { project: Project }) {
  const meta = getProductTypeMeta(project.type);
  const status = STATUS_VARIANT[project.status];

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: meta?.color ?? "#FF6B35" }}
          >
            <span className="text-sm font-bold">
              {meta?.name?.[0] ?? "P"}
            </span>
          </span>
          <div>
            <Link
              href={`/console/projects/${project.id}`}
              className="text-base font-semibold text-zinc-900 hover:text-lynx-600"
            >
              {project.name}
            </Link>
            <p className="text-xs text-zinc-500">{meta?.name ?? project.type}</p>
          </div>
        </div>
        <button className="text-zinc-400 opacity-0 transition-opacity hover:text-zinc-600 group-hover:opacity-100">
          <MoreVertical className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn("border-0", status.className)}
          >
            {status.label}
          </Badge>
          <span className="text-xs text-zinc-400">
            v{project.version}
          </span>
        </div>
        {project.deployUrl && (
          <a
            href={project.deployUrl}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs text-lynx-600 hover:underline"
          >
            {project.deployUrl}
          </a>
        )}
        <p className="text-xs text-zinc-400">
          更新于 {formatRelativeTime(project.updatedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
