import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '../lib/utils';

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => (
    <Loader2
      ref={ref}
      className={cn('animate-spin text-lynx-500', sizeMap[size], className)}
      aria-label="加载中"
      role="status"
      {...props}
    />
  ),
);
Spinner.displayName = 'Spinner';

export { Spinner };
