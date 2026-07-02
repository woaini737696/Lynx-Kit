import * as React from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils.js';

/**
 * Badge —— View + Text 封装。
 * 变体：default / secondary / success / warning / destructive。
 */
const badgeVariants = cva(
  'flex flex-row items-center rounded-full px-2.5 py-0.5',
  {
    variants: {
      variant: {
        default: 'bg-lynx-500',
        secondary: 'bg-zinc-200',
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        destructive: 'bg-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const badgeTextVariants = cva('text-xs font-semibold', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-zinc-900',
      success: 'text-white',
      warning: 'text-white',
      destructive: 'text-white',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends ViewProps,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<View, BadgeProps>(
  ({ className, variant, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={cn(badgeTextVariants({ variant }))}>{children}</Text>
      ) : (
        children
      )}
    </View>
  ),
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
