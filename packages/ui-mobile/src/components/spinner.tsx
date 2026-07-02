import * as React from 'react';
import {
  ActivityIndicator,
  type ActivityIndicatorProps,
} from 'react-native';

import { cn } from '../lib/utils.js';

/**
 * Spinner —— React Native ActivityIndicator 封装。
 * 主品牌色 lynx-500 (#FF6B35)，支持 sm/md/lg。
 */
export interface SpinnerProps
  extends Omit<ActivityIndicatorProps, 'size' | 'color'> {
  size?: 'sm' | 'md' | 'lg';
  /** 自定义颜色（十六进制），默认 lynx-500 品牌色 */
  color?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 36,
} as const;

const Spinner = React.forwardRef<ActivityIndicator, SpinnerProps>(
  ({ size = 'md', color = '#FF6B35', className, ...props }, ref) => {
    return (
      <ActivityIndicator
        ref={ref}
        size={sizeMap[size]}
        color={color}
        className={cn(className)}
        {...props}
      />
    );
  },
);
Spinner.displayName = 'Spinner';

export { Spinner };
