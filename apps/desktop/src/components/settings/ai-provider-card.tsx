"use client";

import * as React from "react";
import {
  KeyRound,
  Link2,
  Cpu,
  FlaskConical,
  Save,
  Star,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  toast,
} from "@lynxkit/ui-web";
import {
  ModelTestResult,
  ConfiguredBadge,
} from "./model-test-result";
import { useAIConfig } from "@/hooks/use-ai-config";
import type { ProviderTestState } from "@/hooks/use-ai-config";
import type { ProviderMeta, AIProvider, AIModelConfig } from "@lynxkit/shared";

interface AIProviderCardProps {
  meta: ProviderMeta;
  /** 本地模型动态列表（仅本地 Provider 使用） */
  localModels?: string[];
}

/**
 * AI Provider 配置卡片
 *
 * - 名称 + 描述 + 官网
 * - API Key 输入框（本地模型隐藏）
 * - API Base 输入框（默认填充 meta.apiBase）
 * - 模型选择下拉
 * - "测试连通性" → POST /api/v1/system/ai-providers/test
 * - "保存" → POST /api/v1/ai/models
 * - "设为默认"
 */
export function AIProviderCard({ meta, localModels }: AIProviderCardProps) {
  const {
    configs,
    activeProvider,
    testStates,
    saveConfig,
    testConfig,
    setDefault,
    isSaving,
    isTesting,
  } = useAIConfig();

  const saved = configs[meta.id];
  const testState = testStates[meta.id];

  const [apiKey, setApiKey] = React.useState(saved?.apiKey ?? "");
  const [apiBase, setApiBase] = React.useState(
    saved?.apiBase ?? meta.apiBase,
  );
  const [model, setModel] = React.useState(
    saved?.model ?? meta.defaultModel,
  );

  React.useEffect(() => {
    setApiKey(saved?.apiKey ?? "");
    setApiBase(saved?.apiBase ?? meta.apiBase);
    setModel(saved?.model ?? meta.defaultModel);
  }, [meta, saved]);

  const isLocal = meta.isLocal;
  const modelOptions = isLocal
    ? (localModels ?? meta.models.map((m) => m.id))
    : meta.models;

  const buildInput = () => ({
    provider: meta.id as AIProvider,
    apiKey: apiKey || (isLocal ? "local" : ""),
    apiBase,
    model,
  });

  const handleTest = async () => {
    if (!isLocal && !apiKey) {
      toast({ title: "请先填写 API Key", variant: "destructive" });
      return;
    }
    try {
      await testConfig(buildInput());
    } catch (e) {
      toast({
        title: "测试失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!isLocal && !apiKey) {
      toast({ title: "请先填写 API Key", variant: "destructive" });
      return;
    }
    try {
      await saveConfig(buildInput());
    } catch (e) {
      toast({
        title: "保存失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  return (
    <Card
      className={
        activeProvider === meta.id
          ? "border-lynx-500 ring-1 ring-lynx-500/30"
          : undefined
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {meta.name}
              {isLocal && (
                <Badge variant="outline" className="text-[10px]">
                  本地
                </Badge>
              )}
              {activeProvider === meta.id && (
                <Badge className="bg-lynx-500/10 text-lynx-600">
                  <Star className="mr-1 h-3 w-3" />
                  默认
                </Badge>
              )}
              {saved && <ConfiguredBadge />}
            </CardTitle>
            <CardDescription className="mt-1">
              {meta.description}
            </CardDescription>
          </div>
          <ModelTestResult
            state={(testState?.state ?? "idle") as ProviderTestState}
            result={testState?.result}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!isLocal && (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              API Key
            </Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
            API Base
          </Label>
          <Input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder={meta.apiBase}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
            模型
          </Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue placeholder="选择模型" />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((m) => {
                const id = typeof m === "string" ? m : m.id;
                const name = typeof m === "string" ? m : m.name;
                return (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {isLocal && localModels && localModels.length === 0 && (
          <p className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
            未检测到本地模型，请确认 Ollama 正在运行并已拉取模型（如{" "}
            <code className="font-mono">ollama pull qwen2.5-coder:7b</code>）。
          </p>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-2 border-t bg-muted/30 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => meta.website && window.open(meta.website, "_blank")}
          className="text-muted-foreground"
        >
          查看文档
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
          >
            <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
            测试连通性
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-lynx-500 text-white hover:bg-lynx-600"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            保存
          </Button>
          {saved && activeProvider !== meta.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void setDefault({ provider: meta.id })}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              设为默认
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
