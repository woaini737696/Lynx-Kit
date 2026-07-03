import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiClient } from '../lib/api';

/**
 * 推送通知 Hook
 *
 * - 注册 expo-notifications push token 并上报后端 /v1/auth/push-token
 * - 监听通知点击：构建完成时跳转到 /build/[sessionId]
 *
 * 仅在物理设备 + 已登录时生效，模拟器/未登录静默跳过。
 */
export function usePushNotifications(enabled: boolean) {
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!enabled) return;

    registerForPushNotifications().catch(() => {
      // 注册失败不阻塞主流程
    });

    // 前台收到通知
    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {
        // 静默处理，可在此更新角标
      });

    // 用户点击通知
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data && typeof data === 'object' && 'sessionId' in data) {
          const sessionId = String(data.sessionId);
          router.push(`/build/${sessionId}`);
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [enabled]);
}

async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  if (!token) return;

  // 上报到后端
  try {
    await apiClient.post('/v1/auth/push-token', { token });
  } catch {
    // 上报失败忽略
  }
}
