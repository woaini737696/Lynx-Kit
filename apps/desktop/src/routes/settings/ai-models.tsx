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
import { Button, Badge } from "@lynxkit/ui-web";
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
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-950 dark:text-ink-0">
          <Cpu className="h-6 w-6 text-ink-950 dark:text-ink-100" />
          {t("settings.aiModelsTitle")}
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {t("aiModels.desc")}
        </p>
      </div>

      {/* 本地 Ollama 检测 */}
      <div className="glass-card mb-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-200/60 px-6 py-4 pb-3 dark:border-ink-800/60">
          <div>
            <h2 className="text-base font-semibold text-ink-950 dark:text-ink-0">{t("aiModels.localOllama")}</h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{t("aiModels.localOllamaDesc")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void detectLocalOllama()}
            disabled={ollama.checking}
            className="rounded-full border-ink-200 text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            {ollama.checking ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t("aiModels.recheck")}
          </Button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            {ollama.checking ? (
              <Badge variant="outline" className="border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-400">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {t("aiModels.detecting")}
              </Badge>
            ) : ollama.running ? (
              <>
                <Badge className="bg-ink-950 text-ink-0 dark:bg-ink-100 dark:text-ink-950">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t("aiModels.running")}
                </Badge>
                <span className="text-sm text-ink-700 dark:text-ink-300">
                  {t("aiModels.modelsCount", { count: ollama.models.length })}
                </span>
              </>
            ) : (
              <>
                <Badge variant="outline" className="border-destructive/30 text-destructive">
                  <XCircle className="mr-1 h-3 w-3" />
                  {t("aiModels.notRunning")}
                </Badge>
                <span className="text-sm text-ink-500 dark:text-ink-400">
                  {ollama.error ?? t("aiModels.installOllama")}
                </span>
              </>
            )}
          </div>

          {ollama.running && ollama.models.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ollama.models.map((m) => (
                <Badge
                  key={m}
                  variant="outline"
                  className="border-ink-200 font-mono text-xs text-ink-700 dark:border-ink-700 dark:text-ink-300"
                >
                  {m}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 云端 Provider 卡片 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {cloudProviders.map((p) => (
          <AIProviderCard key={p.id} meta={p} />
        ))}
      </div>

      {/* 本地 Provider 卡片（Ollama / Mimo） */}
      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink-700 dark:text-ink-300">
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
