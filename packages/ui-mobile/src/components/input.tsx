import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { cn } from '../lib/utils';

/**
 * Input —— React Native TextInput 封装。
 * 支持通过 className 覆盖 NativeWind 样式。
 */
export type InputProps = TextInputProps;

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, placeholderTextColor, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          'h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-900',
          'focus:border-lynx-500',
          className,
        )}
        placeholderTextColor={placeholderTextColor ?? '#a1a1aa'}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
