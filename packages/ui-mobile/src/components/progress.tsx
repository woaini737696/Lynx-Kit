import * as React from 'react';
import { View } from 'react-native';

import { cn } from '../lib/utils.js';

/**
 * Progress —— 进度条组件。
 * 容器 View + 绝对定位的填充指示器，value 范围 0-100。
 */
export interface ProgressProps {
  /** 进度值 0-100 */
  value?: number;
  /** 容器 className */
  className?: string;
  /** 填充指示器 className */
  indicatorClassName?: string;
}

const Progress = React.forwardRef<View, ProgressProps>(
  ({ value = 0, className, indicatorClassName }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <View
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-zinc-200',
          className,
        )}
      >
        <View
          className={cn(
            'absolute left-0 top-0 h-full bg-lynx-500',
            indicatorClassName,
          )}
          style={{ width: `${clamped}%` }}
        />
      </View>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
