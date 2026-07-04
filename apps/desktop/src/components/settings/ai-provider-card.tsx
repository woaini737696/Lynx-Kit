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
    <div
      className={
        activeProvider === meta.id
          ? "glass-card overflow-hidden ring-1 ring-ink-950 dark:ring-ink-100"
          : "glass-card overflow-hidden"
      }
    >
      <div className="border-b border-ink-200/60 px-5 py-4 pb-3 dark:border-ink-800/60">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-950 dark:text-ink-0">
              {meta.name}
              {isLocal && (
                <Badge variant="outline" className="border-ink-200 text-[10px] text-ink-700 dark:border-ink-700 dark:text-ink-300">
                  本地
                </Badge>
              )}
              {activeProvider === meta.id && (
                <Badge className="bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950">
                  <Star className="mr-1 h-3 w-3" />
                  默认
                </Badge>
              )}
              {saved && <ConfiguredBadge />}
            </h3>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {meta.description}
            </p>
          </div>
          <ModelTestResult
            state={(testState?.state ?? "idle") as ProviderTestState}
            result={testState?.result}
          />
        </div>
      </div>

      <div className="space-y-3 p-5">
        {!isLocal && (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-ink-700 dark:text-ink-300">
              <KeyRound className="h-3.5 w-3.5 text-ink-500 dark:text-ink-400" />
              API Key
            </Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
              className="input-glass border-0 font-mono text-xs shadow-none focus-visible:ring-0"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-ink-700 dark:text-ink-300">
            <Link2 className="h-3.5 w-3.5 text-ink-500 dark:text-ink-400" />
            API Base
          </Label>
          <Input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder={meta.apiBase}
            className="input-glass border-0 font-mono text-xs shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-ink-700 dark:text-ink-300">
            <Cpu className="h-3.5 w-3.5 text-ink-500 dark:text-ink-400" />
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
          <p className="rounded-md bg-ink-100/60 p-2 text-xs text-ink-500 dark:bg-ink-900/60 dark:text-ink-400">
            未检测到本地模型，请确认 Ollama 正在运行并已拉取模型（如{" "}
            <code className="font-mono text-ink-700 dark:text-ink-300">ollama pull qwen2.5-coder:7b</code>）。
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-200/60 bg-ink-50/50 px-5 py-3 dark:border-ink-800/60 dark:bg-ink-900/40">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => meta.website && window.open(meta.website, "_blank")}
          className="text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
        >
          查看文档
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="rounded-full border-ink-200 text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
            测试连通性
          </Button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-ink inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            保存
          </button>
          {saved && activeProvider !== meta.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void setDefault({ provider: meta.id })}
              className="text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              设为默认
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
