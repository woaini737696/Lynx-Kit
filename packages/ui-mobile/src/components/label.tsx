import * as React from 'react';
import { Text, type TextProps } from 'react-native';

import { cn } from '../lib/utils.js';

/**
 * Label —— React Native Text 封装。
 * 用于表单字段标题、列表项标签等场景。
 */
export type LabelProps = TextProps;

const Label = React.forwardRef<Text, LabelProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn('text-sm font-medium leading-none text-zinc-900', className)}
      {...props}
    />
  ),
);
Label.displayName = 'Label';

export { Label };
