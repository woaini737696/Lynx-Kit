"use client";

import * as React from "react";
import {
  Cpu,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AIProviderCard } from "@/components/settings/ai-provider-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
} from "@lynxkit/ui-web";
import { useAIConfig } from "@/hooks/use-ai-config";
import { AIProvider } from "@lynxkit/shared";

/**
 * AI 模型配置页（关键页）
 *
 * - 列出 6 大国内模型 Provider（DeepSeek/Kimi/Doubao/Qwen/GLM/Mimo）
 *   + 本地模型（Ollama）
 * - 每个 Provider 一张配置卡片
 * - 桌面端额外：检测本地 Ollama 是否运行，列出可用本地模型
 */
export default function AIModelsPage() {
  const { providers, ollama, detectLocalOllama } = useAIConfig();
  const localProvider = providers.find((p) => p.id === AIProvider.LOCAL);
  const mimoProvider = providers.find((p) => p.id === AIProvider.MIMO);
  const cloudProviders = providers.filter(
    (p) => p.id !== AIProvider.LOCAL && p.id !== AIProvider.MIMO,
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Cpu className="h-6 w-6 text-lynx-500" />
            AI 模型配置
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            配置各模型供应商的 API Key，9 层 Agent 将按默认 Provider 调用。
            桌面端支持本地 Ollama 离线推理。
          </p>
        </div>

        {/* 本地 Ollama 检测 */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">本地模型（Ollama）</CardTitle>
                <CardDescription>
                  检测本机 Ollama 服务，离线可用，数据不出本机
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void detectLocalOllama()}
                disabled={ollama.checking}
              >
                {ollama.checking ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                重新检测
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {ollama.checking ? (
                <Badge variant="outline" className="text-blue-600">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  检测中...
                </Badge>
              ) : ollama.running ? (
                <>
                  <Badge className="bg-green-500/10 text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    运行中
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {ollama.models.length} 个本地模型可用
                  </span>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="text-destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    未运行
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {ollama.error ?? "请安装并启动 Ollama"}
                  </span>
                </>
              )}
            </div>

            {ollama.running && ollama.models.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ollama.models.map((m) => (
                  <Badge key={m} variant="outline" className="font-mono text-xs">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 云端 Provider 卡片 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cloudProviders.map((p) => (
            <AIProviderCard key={p.id} meta={p} />
          ))}
        </div>

        {/* 本地 Provider 卡片（Ollama / Mimo） */}
        <h2 className="mb-3 mt-8 text-sm font-semibold text-muted-foreground">
          本地模型
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {mimoProvider && <AIProviderCard key={mimoProvider.id} meta={mimoProvider} />}
          {localProvider && (
            <AIProviderCard
              key={localProvider.id}
              meta={localProvider}
              localModels={ollama.models}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
