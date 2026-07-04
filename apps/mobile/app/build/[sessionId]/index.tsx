import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Settings2, Code2, Rocket, Eye } from 'lucide-react-native';
import { AGENTS, BuildStatus } from '@lynxkit/shared';
import { useBuildStore } from '@lynxkit/store';
import { buildApi } from '../../../src/lib/api';
import { useBuild } from '../../../src/hooks/use-build';
import {
  AgentProgress,
  type AgentStepStatus,
} from '../../../src/components/agent-progress';

/**
 * 构建进度页
 *
 * - 路由参数：sessionId
 * - SSE 流式订阅 9 层 Agent 进度（use-build hook）
 * - 进度条 + 9 层 Agent 进度卡片（复用 AgentProgress）
 * - 实时日志滚动（自动滚到底部）
 * - 完成时显示「预览 / 部署」按钮并发送本地推送通知
 * - 顶部操作区：配置 / 代码 / 部署 入口（按状态显示）
 *
 * 顶部导航（返回按钮 + 标题）由 Stack 路由统一渲染（见 _layout.tsx）。
 */
export default function BuildProgressScreen() {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  const { data: session, refetch, isLoading } = useQuery({
    queryKey: ['build', id],
    queryFn: () => buildApi.getById(id!),
    enabled: !!id,
  });

  const { subscribeProgress, stopSubscribe } = useBuild();
  const { currentSession, logs, currentAgent, startBuild } = useBuildStore();

  const rawName = session?.config?.name;
  const sessionName = typeof rawName === 'string' ? rawName : undefined;

  // 会话加载后初始化 store 并订阅 SSE（已完成的会话不重复订阅）
  useEffect(() => {
    if (!session) return;
    startBuild(session);
    if (
      session.status !== BuildStatus.DEPLOYED &&
      session.status !== BuildStatus.ERROR
    ) {
      void subscribeProgress(session.id, { sessionName });
    }
    return () => stopSubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const status = currentSession?.status;
  const isDone = status === BuildStatus.DEPLOYED;
  const isError = status === BuildStatus.ERROR;

  // 完成时拉取最新会话（拿到 deployUrl）；失败时触感反馈。
  useEffect(() => {
    if (isDone) {
      refetch();
    } else if (isError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, isError]);

  // 9 层 Agent 状态：依据 currentAgent 推断各步骤 pending / running / done / failed
  const currentStep = currentAgent
    ? AGENTS.find((a) => a.id === currentAgent)?.step ?? 0
    : 0;
  const agentStatuses: Record<string, AgentStepStatus> = {};
  for (const a of AGENTS) {
    if (isDone) {
      agentStatuses[a.id] = 'done';
    } else if (isError && a.id === currentAgent) {
      agentStatuses[a.id] = 'failed';
    } else if (a.step < currentStep) {
      agentStatuses[a.id] = 'done';
    } else if (a.step === currentStep && currentAgent) {
      agentStatuses[a.id] = 'running';
    } else {
      agentStatuses[a.id] = 'pending';
    }
  }
  const percent = isDone ? 100 : Math.round((currentStep / AGENTS.length) * 100);

  // 日志自动滚到底部
  const logRef = useRef<ScrollView>(null);
  useEffect(() => {
    logRef.current?.scrollToEnd({ animated: true });
  }, [logs.length]);

  const deployUrl = session?.deployUrl;
  const shortId = id && id.length > 16 ? `${id.slice(0, 16)}…` : (id ?? '');

  // 导航入口可见性
  const canConfigure =
    status === BuildStatus.CLARIFYING || status === BuildStatus.DRAFT;
  const hasGeneratedCode =
    !!session?.generatedCode && (session.generatedCode.files?.length ?? 0) > 0;
  const canDeploy = status === BuildStatus.DEPLOYED;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-100 dark:bg-ink-950">
        <ActivityIndicator color="#09090B" />
      </View>
    );
  }

  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';

  return (
    <SafeAreaView className="flex-1 bg-ink-100 dark:bg-ink-950" edges={['bottom']}>
      <ScrollView
        contentContainerClassName="px-4 pb-8 gap-5 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        {/* 会话标识：sessionId 标题 */}
        <View className="gap-1">
          <Text className="text-xs text-ink-500 dark:text-ink-400">
            {t('build.sessionTitle')}
          </Text>
          <Text
            className="text-lg font-semibold text-ink-900 dark:text-ink-50"
            numberOfLines={1}
          >
            {sessionName ?? shortId}
          </Text>
          <Text className="text-xs text-ink-500 dark:text-ink-400">{shortId}</Text>
        </View>

        {/* 导航入口：配置 / 代码 / 部署（毛玻璃按钮） */}
        {canConfigure || hasGeneratedCode || canDeploy ? (
          <View className="flex-row gap-3">
            {canConfigure ? (
              <Pressable
                onPress={() => router.push(`/build/${id}/configure`)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 py-3 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
              >
                <Settings2 size={16} color="#09090B" />
                <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  {t('build.configure')}
                </Text>
              </Pressable>
            ) : null}
            {hasGeneratedCode ? (
              <Pressable
                onPress={() => router.push(`/build/${id}/code`)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 py-3 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
              >
                <Code2 size={16} color="#09090B" />
                <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  {t('build.codePreview')}
                </Text>
              </Pressable>
            ) : null}
            {canDeploy ? (
              <Pressable
                onPress={() => router.push(`/build/${id}/deploy`)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 py-3 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
              >
                <Rocket size={16} color="#09090B" />
                <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  {t('build.deployTitle')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* 进度条（毛玻璃卡片） */}
        <View className="gap-2 rounded-3xl border border-white/70 bg-white/70 p-4 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              {t('build.progressTitle')}
            </Text>
            <Text className="text-sm font-semibold text-ink-950 dark:text-ink-50">
              {percent}%
            </Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
            <View
              className="h-full rounded-full bg-ink-950 dark:bg-ink-100"
              style={{ width: `${percent}%` }}
            />
          </View>
          <Text className="text-xs text-ink-500 dark:text-ink-400">
            {isDone
              ? t('build.completed')
              : isError
                ? t('build.failed')
                : currentAgent
                  ? t('build.executing', {
                      task: AGENTS.find((a) => a.id === currentAgent)?.name ?? '',
                    })
                  : t('build.waitingStart')}
          </Text>
        </View>

        {/* 9 层 Agent 进度卡片 */}
        <View className="gap-3">
          <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
            {t('build.pipeline')}
          </Text>
          <AgentProgress agents={AGENTS} statuses={agentStatuses} />
        </View>

        {/* 实时日志（终端样式 bg-ink-950 text-ink-100） */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
            {t('build.realtimeLogs')}
          </Text>
          <View className="rounded-2xl bg-ink-950 p-3">
            {logs.length === 0 ? (
              <Text className="px-1 py-4 text-center font-mono text-xs text-ink-400">
                {t('build.waitingLogs')}
              </Text>
            ) : (
              <ScrollView
                ref={logRef}
                nestedScrollEnabled
                className="max-h-64"
                onContentSizeChange={() =>
                  logRef.current?.scrollToEnd({ animated: true })
                }
              >
                {logs.map((log) => (
                  <Text
                    key={log.id}
                    className="font-mono text-xs leading-5 text-ink-100"
                  >
                    {log.message}
                  </Text>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* 完成操作：预览 / 部署 */}
        {isDone ? (
          <View className="flex-row gap-3 pt-1">
            <Pressable
              onPress={() => {
                if (!deployUrl) return;
                router.push({
                  pathname: '/build/preview',
                  params: { url: deployUrl },
                });
              }}
              disabled={!deployUrl}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-ink-300 bg-transparent py-3.5 active:opacity-80 disabled:opacity-40 dark:border-ink-700"
            >
              <Eye size={18} color="#09090B" />
              <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                {t('build.preview')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (deployUrl) void Linking.openURL(deployUrl);
              }}
              disabled={!deployUrl}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-ink-950 py-3.5 active:opacity-80 disabled:opacity-40 dark:bg-ink-100"
            >
              <Rocket size={18} color={emphasisIcon} />
              <Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
                {t('build.deploy')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
