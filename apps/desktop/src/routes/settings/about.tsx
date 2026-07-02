import * as React from "react";
import { Info, RefreshCw, Check, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  toast,
} from "@lynxkit/ui-web";

const APP_VERSION = "0.1.0";

const TECH_STACK: { category: string; items: string[] }[] = [
  { category: "桌面端", items: ["Electron 30", "Vite 5", "React 19", "React Router 7"] },
  { category: "Web 端", items: ["Next.js 15", "React 19", "Tailwind CSS"] },
  { category: "后端", items: ["Hono", "Node.js", "PostgreSQL", "Drizzle ORM", "Redis"] },
  { category: "Agent 引擎", items: ["9 层 Agent 流水线", "AI SDK", "SSE 流式"] },
  { category: "UI", items: ["shadcn/ui", "Radix UI", "lucide-react"] },
];

export default function AboutPage() {
  const [checking, setChecking] = React.useState(false);
  const [upToDate, setUpToDate] = React.useState<boolean | null>(null);

  const checkUpdate = () => {
    setChecking(true);
    setUpToDate(null);
    // mock 检查更新
    setTimeout(() => {
      setChecking(false);
      setUpToDate(true);
      toast({ title: "已是最新版本", variant: "success" });
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Info className="h-6 w-6 text-lynx-500" />
        <h1 className="text-2xl font-bold">关于</h1>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">LynxKit</CardTitle>
              <CardDescription>AI 全栈产品生成平台</CardDescription>
            </div>
            <Badge variant="outline">v{APP_VERSION}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            通过 9 层 Agent 流水线，从一句话需求自动生成完整的 AI 产品（前端 + 后端 + 数据库 + 部署）。
          </p>
        </CardContent>
        <CardFooter className="border-t bg-muted/30 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={checkUpdate}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : upToDate ? (
              <Check className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {checking ? "检查中..." : upToDate ? "已是最新" : "检查更新"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">技术栈</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {TECH_STACK.map((t) => (
            <div key={t.category} className="flex items-start gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                {t.category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {t.items.map((item) => (
                  <Badge key={item} variant="secondary" className="text-[10px]">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
