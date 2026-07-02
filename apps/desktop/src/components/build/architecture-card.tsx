"use client";

import {
  Check,
  RefreshCw,
  Layers,
  Cpu,
  Database,
  Cloud,
  Bot,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Progress,
} from "@lynxkit/ui-web";
import type { Architecture, ProductType } from "@lynxkit/shared";
import { getProductTypeMeta } from "@lynxkit/shared";

interface ArchitectureCardProps {
  productType: ProductType;
  architecture: Architecture;
  confidence: number;
  onConfirm: () => void;
  onChange: () => void;
  isConfirming?: boolean;
}

/**
 * 架构推荐卡片
 *
 * 展示 ② ARCHITECT Agent 推荐的产品类型 + 技术栈 + 置信度，
 * 提供"确认，开始配置"与"换一个"操作。
 */
export function ArchitectureCard({
  productType,
  architecture,
  confidence,
  onConfirm,
  onChange,
  isConfirming,
}: ArchitectureCardProps) {
  const meta = getProductTypeMeta(productType);
  const pct = Math.round(confidence * 100);

  const stacks = [
    { label: "前端", items: architecture.frontend, icon: Layers },
    { label: "后端", items: architecture.backend, icon: Cpu },
    { label: "数据库", items: architecture.database, icon: Database },
    { label: "AI 集成", items: architecture.ai, icon: Bot },
    { label: "部署", items: architecture.deploy, icon: Cloud },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: meta?.color ?? "#FF6B35" }}
              />
              推荐架构
            </CardTitle>
            <CardDescription className="mt-1">
              {meta?.name ?? productType} · {meta?.description}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-lynx-500/10 text-lynx-600">
            置信度 {pct}%
          </Badge>
        </div>
        <Progress value={pct} className="mt-3 h-1.5" />
      </CardHeader>

      <CardContent className="space-y-4">
        {stacks.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {s.items.length === 0 ? (
                    <span className="text-sm text-muted-foreground/60">
                      暂无
                    </span>
                  ) : (
                    s.items.map((t) => (
                      <Badge key={t} variant="outline" className="font-normal">
                        {t}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="justify-end gap-2 border-t bg-muted/30 py-3">
        <Button variant="outline" onClick={onChange} disabled={isConfirming}>
          <RefreshCw className="mr-2 h-4 w-4" />
          换一个
        </Button>
        <Button onClick={onConfirm} disabled={isConfirming} className="bg-lynx-500 text-white hover:bg-lynx-600">
          <Check className="mr-2 h-4 w-4" />
          确认，开始配置
        </Button>
      </CardFooter>
    </Card>
  );
}
