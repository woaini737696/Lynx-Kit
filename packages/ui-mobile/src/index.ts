/**
 * @lynxkit/ui-mobile
 *
 * LynxKit Mobile 基础组件库（基于 React Native · NativeWind · class-variance-authority）。
 * 主品牌色 lynx-500 (#FF6B35)，与 @lynxkit/ui-web 保持一致的 API 风格。
 * 不依赖 Radix，所有组件使用 React Native 原生组件（View / Text / TextInput /
 * Pressable / ActivityIndicator）封装，通过 NativeWind className 样式 + cva 定义变体。
 */

// 工具
export { cn } from './lib/utils';

// 基础组件
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from './components/button';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/card';
export { Input, type InputProps } from './components/input';
export { Textarea, type TextareaProps } from './components/textarea';
export { Badge, badgeVariants, type BadgeProps } from './components/badge';
export {
  Avatar,
  type AvatarProps,
  type AvatarSource,
} from './components/avatar';
export { Spinner, type SpinnerProps } from './components/spinner';
export { Skeleton, type SkeletonProps } from './components/skeleton';
export { Label, type LabelProps } from './components/label';
export { Separator, type SeparatorProps } from './components/separator';
export { Progress, type ProgressProps } from './components/progress';
export { EmptyState, type EmptyStateProps } from './components/empty-state';
