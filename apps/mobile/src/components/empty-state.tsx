import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** 空状态占位 */
export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-800">
        {icon}
      </View>
      <Text className="text-base font-semibold text-slate-200">{title}</Text>
      {subtitle ? (
        <Text className="text-center text-sm text-slate-400">{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-2 rounded-full bg-lynx-500 px-5 py-2.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
