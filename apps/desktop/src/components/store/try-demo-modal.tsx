"use client";

import * as React from "react";
import { Play, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { electronAPI } from "@/lib/electron";

interface TryDemoModalProps {
  demoUrl?: string;
  productName: string;
  trigger?: React.ReactNode;
}

/**
 * 试用演示弹窗
 *
 * 在 Dialog 内嵌入 iframe 加载 demoUrl，桌面端可外链到系统浏览器。
 */
export function TryDemoModal({
  demoUrl,
  productName,
  trigger,
}: TryDemoModalProps) {
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  if (!demoUrl) {
    return (
      <Button variant="outline" disabled>
        <Play className="mr-2 h-4 w-4" />
        暂无演示
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-lynx-500 text-white hover:bg-lynx-600">
            <Play className="mr-2 h-4 w-4" />
            试用演示
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center justify-between">
            <span>演示：{productName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                electronAPI?.app.openExternal(demoUrl) ||
                window.open(demoUrl, "_blank")
              }
              title="在新窗口打开"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            在弹窗内体验该产品
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-[70vh] bg-muted/20">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              加载演示中...
            </div>
          )}
          <iframe
            src={demoUrl}
            title={productName}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setLoading(false)}
            className="h-full w-full border-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
