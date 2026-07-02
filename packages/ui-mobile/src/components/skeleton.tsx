import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '../lib/utils.js';

/**
 * Skeleton —— 骨架屏占位组件。
 * 使用 animate-pulse 提供脉动动画，尺寸由 className 控制。
 */
export type SkeletonProps = ViewProps;

const Skeleton = React.forwardRef<View, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('animate-pulse rounded-md bg-zinc-200', className)}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
