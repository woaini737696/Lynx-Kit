import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { cn } from '../lib/utils.js';

/**
 * Textarea —— React Native TextInput（multiline）封装。
 * 支持通过 className 覆盖 NativeWind 样式。
 */
export type TextareaProps = TextInputProps;

const Textarea = React.forwardRef<TextInput, TextareaProps>(
  ({ className, placeholderTextColor, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        className={cn(
          'min-h-[80px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900',
          'focus:border-lynx-500',
          className,
        )}
        placeholderTextColor={placeholderTextColor ?? '#a1a1aa'}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
