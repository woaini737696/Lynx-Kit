import * as React from "react";
import { useParams, Link } from "react-router-dom";
import {
  Eye,
  ArrowLeft,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Skeleton,
  toast,
} from "@lynxkit/ui-web";
import { useBuild } from "@/hooks/use-build";
import type { CodeFile } from "@lynxkit/shared";

/**
 * Mock 代码文件集（产品未生成代码时展示，体验完整 UI）
 *
 * 真实场景下由 ⑥⑦⑧ Agent 写入 currentSession.generatedCode.files。
 */
const MOCK_FILES: CodeFile[] = [
  {
    path: "package.json",
    content: `{
  "name": "lynxkit-generated-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node server.js"
  }
}`,
    language: "json",
  },
  {
    path: "src/pages/index.tsx",
    content: `import { useState } from "react";

export default function HomePage() {
  const [count, setCount] = useState(0);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Hello LynxKit</h1>
      <button onClick={() => setCount((c) => c + 1)}>
        点击 {count} 次
      </button>
    </main>
  );
}`,
    language: "tsx",
  },
  {
    path: "src/server/index.ts",
    content: `import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.listen(PORT, () => {
  console.log(\`Server running on :\${PORT}\`);
});`,
    language: "typescript",
  },
  {
    path: "README.md",
    content: `# LynxKit 生成应用

由 9 层 Agent 流水线自动生成的 MVP 应用。

## 启动

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
    language: "markdown",
  },
];

/** 文件图标按扩展名 */
function FileIcon({ name }: { name: string }) {
  if (name.endsWith(".md")) return <FileText className="h-3.5 w-3.5 text-sky-500" />;
  return <FileCode2 className="h-3.5 w-3.5 text-lynx-500" />;
}

/** 构建文件树结构 */
interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: CodeFile;
}

function buildTree(files: CodeFile[]): TreeNode {
  const root: TreeNode = { name: "", path: "", isDir: true, children: [] };
  for (const file of files) {
    const parts = file.path.split("/");
    let cur = root;
    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const fullPath = parts.slice(0, idx + 1).join("/");
      let next = cur.children.find((c) => c.name === part);
      if (!next) {
        next = {
          name: part,
          path: fullPath,
          isDir: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        cur.children.push(next);
      }
      cur = next;
    });
  }
  // 目录优先排序
  const sortRec = (n: TreeNode) => {
    n.children.sort((a, b) =>
      a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1,
    );
    n.children.forEach(sortRec);
  };
  sortRec(root);
  return root;
}

/** 递归渲染树节点 */
function TreeView({
  node,
  depth,
  selectedPath,
  onSelect,
  expanded,
  toggle,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string;
  onSelect: (file: CodeFile) => void;
  expanded: Set<string>;
  toggle: (path: string) => void;
}) {
  return (
    <ul className={depth === 0 ? "" : "ml-3 border-l border-border/60 pl-1"}>
      {node.children.map((child) => {
        const isExpanded = expanded.has(child.path);
        if (child.isDir) {
          return (
            <li key={child.path}>
              <button
                onClick={() => toggle(child.path)}
                className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs hover:bg-muted/60"
                style={{ paddingLeft: depth * 8 + 6 }}
              >
                {isExpanded ? (
                  <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <Folder className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span className="truncate">{child.name}</span>
              </button>
              {isExpanded && (
                <TreeView
                  node={child}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  expanded={expanded}
                  toggle={toggle}
                />
              )}
            </li>
          );
        }
        const isSelected = selectedPath === child.path;
        return (
          <li key={child.path}>
            <button
              onClick={() => child.file && onSelect(child.file)}
              className={
                "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs " +
                (isSelected
                  ? "bg-lynx-500/15 text-lynx-700"
                  : "hover:bg-muted/60")
              }
              style={{ paddingLeft: depth * 8 + 6 }}
            >
              <FileIcon name={child.name} />
              <span className="truncate">{child.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 构建代码预览页
 *
 * - 左侧：文件树（可折叠展开）
 * - 右侧：选中文件代码内容 + 行号
 * - 顶部：文件统计（总数 / 总行数）+ 复制按钮
 * - 会话无生成代码时使用 mock 数据展示
 */
export default function PreviewPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId!;
  const { currentSession, loadSession, reset } = useBuild();

  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<CodeFile | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadSession(sessionId)
      .catch((e) => {
        toast({
          title: "加载会话失败",
          description: e instanceof Error ? e.message : String(e),
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // 文件集（无真实代码时使用 mock）
  const files = React.useMemo(() => {
    const real = currentSession?.generatedCode?.files ?? [];
    return real.length > 0 ? real : MOCK_FILES;
  }, [currentSession]);

  const tree = React.useMemo(() => buildTree(files), [files]);

  // 默认选中第一个文件
  React.useEffect(() => {
    if (!selected && files.length > 0 && files[0]) {
      setSelected(files[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // 默认展开顶层目录
  React.useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const f of files) {
        const parts = f.path.split("/");
        if (parts.length > 1) {
          const top = parts[0];
          if (top) next.add(top);
        }
      }
      return next;
    });
  }, [files]);

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const copyCode = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Skeleton className="mb-4 h-10 w-48 rounded-md" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="col-span-2 h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="px-6 py-20 text-center text-muted-foreground">
        会话不存在或已被删除
      </div>
    );
  }

  const isMock = (currentSession.generatedCode?.files ?? []).length === 0;
  const totalLines = files.reduce(
    (sum, f) => sum + f.content.split("\n").length,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* 顶部 */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to={`/build/${sessionId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              返回控制台
            </Button>
          </Link>
          <Eye className="h-5 w-5 text-lynx-500" />
          <h1 className="text-xl font-bold">代码预览</h1>
          {isMock && (
            <Badge variant="secondary" className="text-[10px]">
              示例数据
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{files.length} 个文件</span>
          <span>·</span>
          <span>{totalLines} 行</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 文件树 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Folder className="h-4 w-4 text-amber-500" />
              文件结构
            </CardTitle>
            <CardDescription className="text-xs">
              {isMock ? "尚未生成代码，展示示例" : "Agent 生成的代码文件"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[520px] overflow-y-auto">
              <TreeView
                node={tree}
                depth={0}
                selectedPath={selected?.path ?? ""}
                onSelect={(f) => setSelected(f)}
                expanded={expanded}
                toggle={toggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* 代码内容 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCode2 className="h-4 w-4 text-lynx-500" />
                {selected ? selected.path : "未选择文件"}
              </CardTitle>
              <div className="flex items-center gap-2">
                {selected && (
                  <Badge variant="outline" className="text-[10px]">
                    {selected.language}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void copyCode()}
                  disabled={!selected}
                >
                  {copied ? (
                    <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {copied ? "已复制" : "复制"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[520px] overflow-auto rounded-md bg-slate-950">
              {selected ? (
                <pre className="min-w-full p-4 font-mono text-xs leading-5 text-slate-200">
                  {selected.content.split("\n").map((line, i) => (
                    <div key={i} className="flex">
                      <span className="mr-4 inline-block w-8 shrink-0 select-none text-right text-slate-600">
                        {i + 1}
                      </span>
                      <span className="whitespace-pre">{line || " "}</span>
                    </div>
                  ))}
                </pre>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4" />
                  请从左侧选择文件
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
