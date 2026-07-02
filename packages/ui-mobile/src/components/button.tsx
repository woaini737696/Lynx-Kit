import * as React from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

/**
 * Button —— React Native Pressable 封装。
 * 通过 cva 定义 variant（primary/secondary/outline/ghost）+ size（sm/md/lg），
 * primary 使用 lynx-500 品牌色。当 children 为字符串时自动包裹 Text。
 */
const buttonVariants = cva(
  'flex flex-row items-center justify-center gap-2 rounded-md disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-lynx-500 active:bg-lynx-600',
        secondary: 'bg-zinc-200 active:bg-zinc-300',
        outline: 'border border-zinc-300 bg-transparent active:bg-zinc-100',
        ghost: 'bg-transparent active:bg-zinc-100',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

const buttonTextVariants = cva('font-medium', {
  variants: {
    variant: {
      primary: 'text-white',
      secondary: 'text-zinc-900',
      outline: 'text-zinc-900',
      ghost: 'text-zinc-900',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text className={cn(buttonTextVariants({ variant, size }))}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
