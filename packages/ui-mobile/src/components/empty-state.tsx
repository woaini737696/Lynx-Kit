import * as React from 'react';
import { Text, View } from 'react-native';

import { cn } from '../lib/utils.js';
import { Button } from './button.js';

/**
 * EmptyState —— 空状态展示组件。
 * 由 icon + title + description + 可选操作按钮组成。
 */
export interface EmptyStateProps {
  /** lucide-react-native 图标组件 */
  icon?: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  /** 主标题 */
  title: string;
  /** 描述文本 */
  description?: string;
  /** 操作按钮文案；提供 onAction 时生效 */
  actionLabel?: string;
  /** 操作按钮点击回调 */
  onAction?: () => void;
  /** 自定义容器 className */
  className?: string;
}

const EmptyState = React.forwardRef<View, EmptyStateProps>(
  (
    { icon: Icon, title, description, actionLabel, onAction, className },
    ref,
  ) => {
    return (
      <View
        ref={ref}
        className={cn(
          'flex items-center justify-center px-6 py-12',
          className,
        )}
      >
        {Icon ? (
          <View className="mb-4">
            <Icon size={48} color="#a1a1aa" />
          </View>
        ) : null}
        <Text className="text-center text-lg font-semibold text-zinc-900">
          {title}
        </Text>
        {description ? (
          <Text className="mt-1.5 text-center text-sm text-zinc-500">
            {description}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <View className="mt-6">
            <Button variant="primary" size="md" onPress={onAction}>
              {actionLabel}
            </Button>
          </View>
        ) : null}
      </View>
    );
  },
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
