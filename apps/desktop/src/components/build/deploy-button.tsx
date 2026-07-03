"use client";

import * as React from "react";
import { Rocket, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { buildApi } from "@/lib/api";
import { electronAPI } from "@/lib/electron";

interface DeployButtonProps {
  sessionId: string;
  deployUrl?: string;
  onDeployed?: (url: string) => void;
}

/**
 * 一键部署按钮
 *
 * 调 POST /v1/build/[id]/start 启动部署 Agent；
 * 部署完成后弹出系统通知（桌面端）并展示访问入口。
 */
export function DeployButton({
  sessionId,
  deployUrl,
  onDeployed,
}: DeployButtonProps) {
  const [deploying, setDeploying] = React.useState(false);
  const [url, setUrl] = React.useState<string | undefined>(deployUrl);

  const deploy = async () => {
    setDeploying(true);
    try {
      await buildApi.start(sessionId);
      // 简化：轮询会话状态直至 deployed
      const final = await pollUntilDeployed(sessionId);
      setUrl(final.deployUrl);
      onDeployed?.(final.deployUrl ?? "");
      toast({ title: "部署完成 🚀", variant: "success" });
      electronAPI?.notification.notifyBuildDone(
        "妙想 构建完成",
        "你的 AI 产品已部署上线，点击查看",
      );
    } catch (e) {
      toast({
        title: "部署失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {url ? (
        <>
          <Button variant="outline" onClick={() => electronAPI?.app.openExternal(url) || window.open(url, "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            访问站点
          </Button>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            已部署
          </span>
        </>
      ) : (
        <Button
          onClick={deploy}
          disabled={deploying}
          className="bg-lynx-500 text-white hover:bg-lynx-600"
        >
          {deploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              部署中...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              一键部署
            </>
          )}
        </Button>
      )}
    </div>
  );
}

async function pollUntilDeployed(
  sessionId: string,
  timeoutMs = 120_000,
): Promise<{ deployUrl?: string }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const session = await buildApi.getById(sessionId);
    if (session.status === "deployed" || session.deployUrl) {
      return { deployUrl: session.deployUrl };
    }
    if (session.status === "error") {
      throw new Error("部署阶段出错");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("部署超时");
}
