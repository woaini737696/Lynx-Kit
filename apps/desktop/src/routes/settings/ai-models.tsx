import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Cpu,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
  const { t } = useTranslation();
  const { providers, ollama, detectLocalOllama } = useAIConfig();
  const localProvider = providers.find((p) => p.id === AIProvider.LOCAL);
  const mimoProvider = providers.find((p) => p.id === AIProvider.MIMO);
  const cloudProviders = providers.filter(
    (p) => p.id !== AIProvider.LOCAL && p.id !== AIProvider.MIMO,
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Cpu className="h-6 w-6 text-lynx-500" />
          {t("settings.aiModelsTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("aiModels.desc")}
        </p>
      </div>

      {/* 本地 Ollama 检测 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("aiModels.localOllama")}</CardTitle>
              <CardDescription>{t("aiModels.localOllamaDesc")}</CardDescription>
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
              {t("aiModels.recheck")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {ollama.checking ? (
              <Badge variant="outline" className="text-blue-600">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {t("aiModels.detecting")}
              </Badge>
            ) : ollama.running ? (
              <>
                <Badge className="bg-green-500/10 text-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t("aiModels.running")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {t("aiModels.modelsCount", { count: ollama.models.length })}
                </span>
              </>
            ) : (
              <>
                <Badge variant="outline" className="text-destructive">
                  <XCircle className="mr-1 h-3 w-3" />
                  {t("aiModels.notRunning")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {ollama.error ?? t("aiModels.installOllama")}
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
        {t("aiModels.localModels")}
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
  );
}
