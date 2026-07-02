"use client";

import * as React from "react";
import {
  FileCode2,
  Copy,
  Check,
  Download,
  FolderTree,
} from "lucide-react";
import {
  Card,
  CardContent,
  ScrollArea,
  Button,
  Badge,
  toast,
} from "@lynxkit/ui-web";
import { cn, formatBytes } from "@/lib/utils";
import { electronAPI } from "@/lib/electron";

interface CodeFile {
  path: string;
  content: string;
  language: string;
}

interface CodeViewerProps {
  files: CodeFile[];
  /** 关联的构建会话 ID，用于本地保存 */
  sessionId?: string;
}

/**
 * 代码查看器
 *
 * 左侧文件树 + 右侧代码内容。
 * 支持复制单文件、保存全部到本地（桌面端通过 Electron 文件对话框）。
 */
export function CodeViewer({ files, sessionId }: CodeViewerProps) {
  const [active, setActive] = React.useState<string>(files[0]?.path ?? "");
  const [copied, setCopied] = React.useState(false);

  const current = files.find((f) => f.path === active) ?? files[0];

  const copy = async () => {
    if (!current) return;
    await navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const saveAll = async () => {
    if (!current) return;
    // 桌面端：合并为单个文件保存（简化）；非桌面端提示
    const bundle = files
      .map((f) => `// ===== ${f.path} =====\n${f.content}`)
      .join("\n\n");
    const result = await electronAPI?.filesystem.saveFile(
      `lynxkit-${sessionId ?? "output"}.txt`,
      bundle,
    );
    if (result?.saved) {
      toast({ title: "已保存到本地", description: result.path ?? "", variant: "success" });
    } else if (!electronAPI) {
      toast({ title: "桌面端可保存到本地文件", description: "请在 Electron 环境中使用" });
    }
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          暂无生成代码
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex h-[480px]">
        {/* 文件树 */}
        <div className="w-56 shrink-0 border-r border-border bg-muted/30">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" />
              文件 ({files.length})
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveAll} title="保存到本地">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-2rem)]">
            <div className="space-y-0.5 p-1.5">
              {files.map((f) => (
                <button
                  key={f.path}
                  onClick={() => setActive(f.path)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition",
                    active === f.path
                      ? "bg-lynx-500/10 text-lynx-600 dark:text-lynx-400"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{f.path}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 代码内容 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">{current?.path}</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {current?.language}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy} title="复制">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
              <code>{current?.content}</code>
            </pre>
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}
