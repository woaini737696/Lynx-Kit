"use client";

import * as React from "react";
import {
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
} from "lucide-react";
import { Button, Badge } from "@lynxkit/ui-web";
import { cn } from "@/lib/utils";

type Viewport = "mobile" | "tablet" | "desktop";

const SIZES: Record<Viewport, { w: number; h: number; label: string }> = {
  mobile: { w: 375, h: 667, label: "375 × 667" },
  tablet: { w: 768, h: 1024, label: "768 × 1024" },
  desktop: { w: 1280, h: 800, label: "1280 × 800" },
};

interface LivePreviewProps {
  /** 生成的 HTML 文档字符串（直接渲染到 iframe） */
  html?: string;
  /** 或一个外部 URL */
  url?: string;
  className?: string;
}

/**
 * 实时预览
 *
 * 通过 Blob URL 将生成的 HTML 渲染到 iframe（沙箱隔离）。
 * 支持移动 / 平板 / 桌面三种视口尺寸切换 + 刷新。
 */
export function LivePreview({ html, url, className }: LivePreviewProps) {
  const [device, setDevice] = React.useState<Viewport>("desktop");
  const [reloadKey, setReloadKey] = React.useState(0);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const blobUrl = React.useMemo(() => {
    if (!html) return null;
    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [html]);

  React.useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const src = url ?? blobUrl;
  const size = SIZES[device];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {(Object.keys(SIZES) as Viewport[]).map((d) => {
            const Icon = d === "mobile" ? Smartphone : d === "tablet" ? Tablet : Monitor;
            return (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={cn(
                  "rounded-md p-1.5 transition",
                  device === d
                    ? "bg-lynx-500/15 text-lynx-600 dark:text-lynx-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={d}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            {size.label}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setReloadKey((k) => k + 1)}
            title="刷新"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {src && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => window.open(src, "_blank")}
              title="新窗口打开"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/20 p-4">
        {src ? (
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={src}
            title="实时预览"
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="rounded-lg border border-border bg-white shadow-lg transition-all"
            style={{ width: size.w, height: size.h, maxWidth: "100%" }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground">
            <Monitor className="mb-2 h-8 w-8 opacity-40" />
            等待 ⑥ 前端开发 Agent 生成代码...
          </div>
        )}
      </div>
    </div>
  );
}
