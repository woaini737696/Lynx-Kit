import { Server as ServerIcon, Cpu, HardDrive, MemoryStick } from "lucide-react";

import type { Server, ServerStatus } from "@lynxkit/shared";
import { formatRelativeTime } from "@lynxkit/shared";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 服务器状态徽章样式
const STATUS_STYLE: Record<
  ServerStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "待验证",
    className: "bg-zinc-100 text-zinc-700",
    dot: "bg-zinc-400",
  },
  connected: {
    label: "已连接",
    className: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  docker_ready: {
    label: "Docker 就绪",
    className: "bg-cyan-100 text-cyan-700",
    dot: "bg-cyan-500",
  },
  caddy_ready: {
    label: "Caddy 就绪",
    className: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  error: {
    label: "连接异常",
    className: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

export function ServerCard({ server }: { server: Server }) {
  const status = STATUS_STYLE[server.status];

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
            <ServerIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-zinc-900">
              {server.name}
            </h3>
            <p className="text-xs text-zinc-500">
              {server.ip}:{server.port}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("border-0", status.className)}>
          <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs text-zinc-600">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-zinc-400" />
            <span>{server.cpuCores ? `${server.cpuCores} 核` : "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MemoryStick className="h-3.5 w-3.5 text-zinc-400" />
            <span>
              {server.memoryMB ? `${(server.memoryMB / 1024).toFixed(1)}G` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
            <span>{server.diskGB ? `${server.diskGB}G` : "—"}</span>
          </div>
        </div>
        {server.osInfo && (
          <p className="truncate text-xs text-zinc-400">{server.osInfo}</p>
        )}
        <p className="text-xs text-zinc-400">
          更新于 {formatRelativeTime(server.updatedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
