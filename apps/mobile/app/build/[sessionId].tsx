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
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AGENTS, BuildStatus } from '@lynxkit/shared';
import { useBuildStore } from '@lynxkit/store';
import { buildApi } from '../../src/lib/api';
import { useBuild } from '../../src/hooks/use-build';
import {
  AgentProgress,
  type AgentStepStatus,
} from '../../src/components/agent-progress';
import { Eye, Rocket } from 'lucide-react-native';

/**
 * 构建进度页
 *
 * - 路由参数：sessionId
 * - SSE 流式订阅 9 层 Agent 进度（use-build hook）
 * - 进度条 + 9 层 Agent 进度卡片（复用 AgentProgress）
 * - 实时日志滚动（自动滚到底部）
 * - 完成时显示「预览 / 部署」按钮并发送本地推送通知
 *
 * 顶部导航（返回按钮 + 标题）由 Stack 路由统一渲染（见 _layout.tsx）。
 */
export default function BuildProgressScreen() {
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
  // 推送通知由 use-build hook 在 SSE done 事件中发送（仅对实时完成的构建触发）。
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['bottom']}>
      <ScrollView
        contentContainerClassName="px-4 pb-8 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        {/* 会话标识：sessionId 标题 */}
        <View className="gap-1 pt-4">
          <Text className="text-xs text-slate-500">构建会话</Text>
          <Text className="text-lg font-bold text-white" numberOfLines={1}>
            {sessionName ?? shortId}
          </Text>
          <Text className="text-xs text-slate-500">{shortId}</Text>
        </View>

        {/* 进度条 */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-200">
              构建进度
            </Text>
            <Text className="text-sm font-semibold text-lynx-500">
              {percent}%
            </Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-slate-800">
            <View
              className="h-full rounded-full bg-lynx-500"
              style={{ width: `${percent}%` }}
            />
          </View>
          <Text className="text-xs text-slate-400">
            {isDone
              ? '构建完成 🎉'
              : isError
                ? '构建失败，请查看日志'
                : currentAgent
                  ? `正在执行：${AGENTS.find((a) => a.id === currentAgent)?.name ?? ''}`
                  : '等待启动…'}
          </Text>
        </View>

        {/* 9 层 Agent 进度卡片 */}
        <View className="gap-3">
          <Text className="text-sm font-semibold text-slate-200">
            9 层 Agent 流水线
          </Text>
          <AgentProgress agents={AGENTS} statuses={agentStatuses} />
        </View>

        {/* 实时日志（自动滚到底部） */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-200">实时日志</Text>
          <View className="rounded-2xl bg-slate-900 p-3">
            {logs.length === 0 ? (
              <Text className="px-1 py-4 text-center text-xs text-slate-500">
                等待 Agent 输出…
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
                    className="font-mono text-xs leading-5 text-slate-300"
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
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-slate-700 py-3.5 active:opacity-80 disabled:opacity-40"
            >
              <Eye size={18} color="#F8FAFC" />
              <Text className="text-sm font-semibold text-white">预览</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (deployUrl) void Linking.openURL(deployUrl);
              }}
              disabled={!deployUrl}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-lynx-500 py-3.5 active:opacity-80 disabled:opacity-40"
            >
              <Rocket size={18} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">部署</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
