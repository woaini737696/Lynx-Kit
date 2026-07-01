"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

import { PRODUCT_TYPES, type ProjectType } from "@lynxkit/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/lib/use-toast";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);
  const [name, setName] = useState("");
  const [serverId, setServerId] = useState("");

  // 拉取服务器列表供选择
  const serversQuery = trpc.server.list.useQuery({});
  const servers = serversQuery.data?.items ?? [];

  const selectedMeta = useMemo(
    () => PRODUCT_TYPES.find((p) => p.id === selectedType),
    [selectedType]
  );

  const createMutation = trpc.project.create.useMutation({
    onSuccess: (data) => {
      const project = data as { id?: string };
      toast({ title: "项目创建成功", description: "即将进入项目..." });
      router.push(`/console/projects/${project?.id ?? ""}`);
    },
    onError: (err) => {
      toast({
        title: "创建失败",
        description: err.message ?? "请稍后重试",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedType || !name.trim() || !serverId) {
      toast({
        title: "请完善信息",
        description: "需要选择产品类型、填写项目名并选择服务器",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      type: selectedType,
      serverId,
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <div>
        <Link
          href="/console/projects"
          className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          返回项目列表
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">新建项目</h1>
      </div>

      {/* 步骤 1：选择产品类型 */}
      <Card>
        <CardHeader>
          <CardTitle>
            1. 选择产品类型{" "}
            {selectedMeta && (
              <span className="text-sm font-normal text-zinc-500">
                已选：{selectedMeta.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_TYPES.map((product) => {
              const selected = selectedType === product.id;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedType(product.id)}
                  className={cn(
                    "relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-sm",
                    selected
                      ? "border-lynx-500 bg-lynx-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  )}
                >
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-lynx-500 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: product.color }}
                  >
                    <span className="text-sm font-bold">
                      {product.name[0]}
                    </span>
                  </span>
                  <h3 className="mt-3 font-semibold text-zinc-900">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {product.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 步骤 2：填写项目信息 */}
      <Card>
        <CardHeader>
          <CardTitle>2. 填写项目信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              项目名称
            </label>
            <Input
              id="name"
              placeholder="例如：我的个人官网"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="server"
              className="text-sm font-medium text-zinc-700"
            >
              部署服务器
            </label>
            {serversQuery.isLoading ? (
              <p className="text-sm text-zinc-400">加载服务器列表...</p>
            ) : servers.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-200 p-4 text-center">
                <p className="text-sm text-zinc-500">还没有可用的服务器</p>
                <Button variant="link" size="sm" asChild>
                  <Link href="/console/servers">去添加服务器</Link>
                </Button>
              </div>
            ) : (
              <select
                id="server"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-lynx-500 focus:outline-none focus:ring-2 focus:ring-lynx-500/20"
              >
                <option value="">请选择服务器</option>
                {servers.map((s: { id: string; name: string; ip: string }) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.ip})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href="/console/projects">取消</Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !selectedType || !name || !serverId}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              创建项目
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
