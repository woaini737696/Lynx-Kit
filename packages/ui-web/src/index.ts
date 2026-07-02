/**
 * @lynxkit/ui-web
 *
 * LynxKit Web/Desktop 基础组件库（基于 shadcn/ui · Radix UI · Tailwind）。
 * 主品牌色 lynx-500 (#FF6B35)，支持暗色模式（CSS 变量）。
 * 不依赖 Next.js，可在任意 React 18/19 项目中使用。
 */

// 工具
export { cn } from './lib/utils';

// 基础组件
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from './components/button';
export { Input, type InputProps } from './components/input';
export { Textarea, type TextareaProps } from './components/textarea';
export { Label } from './components/label';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/card';
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from './components/dialog';
export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetOverlay,
  SheetPortal,
} from './components/sheet';
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './components/dropdown-menu';
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './components/select';
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from './components/tabs';
export { Badge, badgeVariants, type BadgeProps } from './components/badge';
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from './components/avatar';
export { Separator } from './components/separator';
export { ScrollArea, ScrollBar } from './components/scroll-area';
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './components/tooltip';
export { Progress } from './components/progress';
export { Skeleton } from './components/skeleton';
export { Spinner, type SpinnerProps } from './components/spinner';

// Toast 系统（自定义实现，不依赖 sonner / @radix-ui/react-toast）
export {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  toast,
  dismiss,
  useToast,
  toastVariants,
  type ToastProps,
  type ToastOptions,
} from './components/toast';
export { Toaster } from './components/toaster';
