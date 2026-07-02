import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '../lib/utils';

/**
 * Separator —— React Native View 分隔线。
 * 支持 horizontal / vertical 两个方向。
 */
export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
}

const Separator = React.forwardRef<View, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'bg-zinc-200',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = 'Separator';

export { Separator };
