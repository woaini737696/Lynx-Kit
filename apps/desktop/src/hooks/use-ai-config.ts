"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@lynxkit/ui-web";
import { useAIConfigStore } from "@lynxkit/store";
import { aiApi } from "@/lib/api";
import { withElectron } from "@/lib/electron";
import type { AIProvider, AIModelConfig } from "@lynxkit/shared";
import type { TestAiModelResult, UpsertAiModelInput } from "@lynxkit/api-client";
import { AI_PROVIDERS, getProvider } from "@lynxkit/shared";

/** 单个 Provider 的连通性测试状态 */
export type ProviderTestState = "idle" | "testing" | "success" | "failed";

/** 桌面端本地 Ollama 状态 */
export interface LocalOllamaState {
  running: boolean;
  models: string[];
  error?: string;
  checking: boolean;
}

/**
 * AI 模型配置 Hook
 *
 * 管理 6 大国内 Provider + 本地模型的配置卡片状态：
 * - 加载已配置的模型（从后端）
 * - 保存配置（写入后端 + 本地 store 缓存）
 * - 测试连通性
 * - 桌面端：检测本地 Ollama 运行状态并枚举本地模型
 */
export function useAIConfig() {
  const { configs, activeProvider, setConfig, removeConfig, setActive } =
    useAIConfigStore();

  const [testStates, setTestStates] = useState<
    Partial<Record<AIProvider, { state: ProviderTestState; result?: TestAiModelResult }>>
  >({});

  const [ollama, setOllama] = useState<LocalOllamaState>({
    running: false,
    models: [],
    checking: false,
  });

  /** 拉取后端已保存的模型配置，回填到本地 store */
  const loadConfigs = useCallback(async () => {
    try {
      const list = await aiApi.list();
      for (const cfg of list) {
        setConfig(cfg.provider, cfg);
      }
      return list;
    } catch {
      // 后端未启动时使用本地缓存的配置
      return [];
    }
  }, [setConfig]);

  /** 保存单个 Provider 配置 */
  const saveMutation = useMutation({
    mutationFn: (input: UpsertAiModelInput) => aiApi.save(input),
    onSuccess: (cfg: AIModelConfig) => {
      setConfig(cfg.provider, cfg);
      toast({ title: `${getProvider(cfg.provider)?.name ?? cfg.provider} 配置已保存`, variant: "success" });
    },
  });

  /** 测试连通性 */
  const testMutation = useMutation({
    mutationFn: (input: UpsertAiModelInput) => aiApi.test(input),
    onMutate: (input) => {
      setTestStates((s) => ({
        ...s,
        [input.provider]: { state: "testing" },
      }));
    },
    onSuccess: (result, input) => {
      setTestStates((s) => ({
        ...s,
        [input.provider]: {
          state: result.ok ? "success" : "failed",
          result,
        },
      }));
      toast(
        result.ok
          ? { title: "连通性测试通过", description: `耗时 ${result.latencyMs ?? "-"}ms`, variant: "success" }
          : { title: "连通性测试失败", description: result.error, variant: "destructive" },
      );
    },
    onError: (err: unknown, input) => {
      setTestStates((s) => ({
        ...s,
        [input.provider]: { state: "failed" },
      }));
      toast({
        title: "测试请求失败",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    },
  });

  /** 设为默认 Provider */
  const setDefaultMutation = useMutation({
    mutationFn: ({ provider, applyToAgents }: { provider: AIProvider; applyToAgents?: string[] }) =>
      aiApi.setDefault(provider, applyToAgents),
    onSuccess: (_res, { provider }) => {
      setActive(provider);
      toast({ title: `已设为默认：${getProvider(provider)?.name ?? provider}`, variant: "success" });
    },
  });

  /** 桌面端：检测本地 Ollama */
  const detectLocalOllama = useCallback(async (apiBase?: string) => {
    setOllama((s) => ({ ...s, checking: true }));
    const result = await withElectron((api) => api.localAI.detectOllama(apiBase));
    setOllama({
      running: result?.running ?? false,
      models: result?.models ?? [],
      error: result?.error,
      checking: false,
    });
    return result;
  }, []);

  // 进入页面时检测一次本地 Ollama + 拉取后端配置
  useEffect(() => {
    void detectLocalOllama();
    void loadConfigs();
    // 仅在挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // 元数据
    providers: AI_PROVIDERS,
    // 状态
    configs,
    activeProvider,
    testStates,
    ollama,
    // actions
    loadConfigs,
    saveConfig: saveMutation.mutateAsync,
    testConfig: testMutation.mutateAsync,
    setDefault: setDefaultMutation.mutateAsync,
    removeConfig,
    setActive,
    detectLocalOllama,
    isSaving: saveMutation.isPending,
    isTesting: testMutation.isPending,
  };
}
