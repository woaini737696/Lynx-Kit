import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** 空状态占位 —— 毛玻璃圆形容器 + 纯黑行动按钮 */
export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/70 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
        {icon}
      </View>
      <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-center text-sm text-ink-500 dark:text-ink-400">
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-2 rounded-full bg-ink-950 px-5 py-2.5 active:opacity-80 dark:bg-ink-100"
        >
          <Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
