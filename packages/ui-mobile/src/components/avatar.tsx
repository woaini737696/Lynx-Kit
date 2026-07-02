import * as React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { cn } from '../lib/utils';

/**
 * Avatar —— 基于 expo-image 的头像组件。
 * 当 source 缺失或加载失败时，回退显示 name 的首字母。
 */
export type AvatarSource = string | number | { uri: string };

export interface AvatarProps {
  /** expo-image 图源；缺省或加载失败时显示 fallback */
  source?: AvatarSource;
  /** 用于生成 fallback 首字母的名字 */
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** 自定义 fallback 背景色 className */
  fallbackClassName?: string;
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
} as const;

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
} as const;

/**
 * 从名字中提取首字母（最多两位）。
 */
function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  return parts.length === 1
    ? first.charAt(0).toUpperCase()
    : (first.charAt(0) + last.charAt(0)).toUpperCase();
}

const Avatar = React.forwardRef<View, AvatarProps>(
  (
    { source, name, size = 'md', className, fallbackClassName },
    ref,
  ) => {
    const [hasError, setHasError] = React.useState(false);

    return (
      <View
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-full',
          sizeMap[size],
          className,
        )}
      >
        {source && !hasError ? (
          <Image
            source={source}
            className="h-full w-full"
            onError={() => setHasError(true)}
          />
        ) : (
          <View
            className={cn(
              'flex h-full w-full items-center justify-center bg-lynx-100',
              fallbackClassName,
            )}
          >
            <Text className={cn('font-medium text-lynx-700', textSizeMap[size])}>
              {getInitials(name)}
            </Text>
          </View>
        )}
      </View>
    );
  },
);
Avatar.displayName = 'Avatar';

export { Avatar };
