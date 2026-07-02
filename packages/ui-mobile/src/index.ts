/**
 * @lynxkit/ui-mobile
 *
 * LynxKit Mobile 基础组件库（基于 React Native · NativeWind · class-variance-authority）。
 * 主品牌色 lynx-500 (#FF6B35)，与 @lynxkit/ui-web 保持一致的 API 风格。
 * 不依赖 Radix，所有组件使用 React Native 原生组件（View / Text / TextInput /
 * Pressable / ActivityIndicator）封装，通过 NativeWind className 样式 + cva 定义变体。
 */

// 工具
export { cn } from './lib/utils.js';

// 基础组件
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from './components/button.js';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/card.js';
export { Input, type InputProps } from './components/input.js';
export { Textarea, type TextareaProps } from './components/textarea.js';
export { Badge, badgeVariants, type BadgeProps } from './components/badge.js';
export {
  Avatar,
  type AvatarProps,
  type AvatarSource,
} from './components/avatar.js';
export { Spinner, type SpinnerProps } from './components/spinner.js';
export { Skeleton, type SkeletonProps } from './components/skeleton.js';
export { Label, type LabelProps } from './components/label.js';
export { Separator, type SeparatorProps } from './components/separator.js';
export { Progress, type ProgressProps } from './components/progress.js';
export { EmptyState, type EmptyStateProps } from './components/empty-state.js';
