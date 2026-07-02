import { useCallback, useRef } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import {
  AgentRole,
  BuildStatus,
  LogLevel,
  type ProductType,
} from '@lynxkit/shared';
import type { AgentStreamEvent } from '@lynxkit/api-client';
import { useBuildStore } from '@lynxkit/store';
import { buildApi } from '../lib/api';

/**
 * 构建 Hook —— 简化移动端「灵感输入 → 创建会话 → 跳转进度页」流程，
 * 并提供 SSE 流式订阅 9 层 Agent 进度的能力（进度页使用）。
 *
 * 流式事件写入 @lynxkit/store 的 build-store（logs / currentAgent / status），
 * 进度页通过 store 订阅渲染，与桌面端 use-build 行为对齐。
 */
export function useBuild() {
  const { appendLog, setCurrentAgent, updateStatus } = useBuildStore();
  const streamingRef = useRef<AbortController | null>(null);

  /**
   * 提交灵感输入，创建构建会话并跳转到进度页。
   *
   * 移动端默认 skipClarify=false，让 ③ CLARIFY Agent 主动询问；
   * 如用户选择「快速构建」可传 skipClarify=true 跳过澄清。
   */
  const createAndStart = useCallback(
    async (input: {
      productType: ProductType;
      userInput: string;
      skipClarify?: boolean;
    }) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const session = await buildApi.create(input);
      await buildApi.start(session.id);
      router.push(`/build/${session.id}`);
      return session;
    },
    [],
  );

  /**
   * SSE 订阅构建会话的 Agent 流式响应。
   *
   * 将 log/token 事件追加到 store 的 logs；
   * done 事件将状态置为 deployed（progress=100）；
   * error 事件将状态置为 error 并追加错误日志。
   * 完成 / 失败时触发触感反馈。
   */
  const subscribeProgress = useCallback(
    async (sessionId: string, opts?: { sessionName?: string }) => {
      // 中止上一次订阅
      streamingRef.current?.abort();
      const controller = new AbortController();
      streamingRef.current = controller;

      try {
        for await (const raw of buildApi.streamAgent(sessionId)) {
          if (controller.signal.aborted) break;

          let event: AgentStreamEvent | null = null;
          try {
            event = JSON.parse(raw) as AgentStreamEvent;
          } catch {
            // 非 JSON 的纯文本日志
            appendLog({
              id: makeLogId(),
              sessionId,
              agent: AgentRole.FRONTEND_DEV,
              level: LogLevel.INFO,
              message: raw,
              createdAt: new Date().toISOString(),
            });
            continue;
          }
          if (!event) continue;

          if (event.agent) setCurrentAgent(event.agent as AgentRole);

          if (event.type === 'log' || event.type === 'token') {
            appendLog({
              id: makeLogId(),
              sessionId,
              agent: (event.agent ?? AgentRole.FRONTEND_DEV) as AgentRole,
              level: LogLevel.INFO,
              message: event.data,
              createdAt: event.timestamp ?? new Date().toISOString(),
            });
          } else if (event.type === 'done') {
            updateStatus(BuildStatus.DEPLOYED, 100);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            void sendBuildCompleteNotification(sessionId, opts?.sessionName);
          } else if (event.type === 'error') {
            updateStatus(BuildStatus.ERROR);
            appendLog({
              id: makeLogId(),
              sessionId,
              agent: (event.agent ?? AgentRole.FRONTEND_DEV) as AgentRole,
              level: LogLevel.ERROR,
              message: event.data,
              createdAt: event.timestamp ?? new Date().toISOString(),
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }
      } catch {
        // 流中断（网络 / 取消），静默处理
      }
    },
    [appendLog, setCurrentAgent, updateStatus],
  );

  /** 中止 SSE 订阅（进度页卸载时调用） */
  const stopSubscribe = useCallback(() => {
    streamingRef.current?.abort();
    streamingRef.current = null;
  }, []);

  return { createAndStart, subscribeProgress, stopSubscribe };
}

/** 生成临时日志 ID（Hermes 无 crypto.randomUUID） */
function makeLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** 构建完成时发送本地推送通知（携带 sessionId 供点击跳转进度页） */
async function sendBuildCompleteNotification(
  sessionId: string,
  name?: string,
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '构建完成 🎉',
        body: name ? `${name} 已部署成功` : '你的产品已部署成功',
        data: { sessionId },
      },
      trigger: null,
    });
  } catch {
    // 通知发送失败忽略
  }
}
