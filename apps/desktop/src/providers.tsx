import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@lynxkit/ui-web";
import { useUIStore } from "@lynxkit/store";
import "@/i18n"; // i18n 初始化（副作用 import）
import { initWebVitals } from "@/lib/web-vitals";

// 启动 Web Vitals 采集（main process 会捕获 console 写入 renderer-debug.log）
initWebVitals();

/**
 * 全局 Providers
 *
 * - TanStack Query：服务端状态管理（构建会话 / 商店 / 创作者 / AI 配置）
 * - 主题 Provider：根据 @lynxkit/store 的 ui-store 同步 .dark class 到 <html>
 * - Toaster：全局通知容器（来自 @lynxkit/ui-web）
 */
function ThemeSync({ theme }: { theme: "light" | "dark" | "system" }) {
  React.useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => {
      root.classList.toggle("dark", dark);
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches);
      const onChange = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    apply(theme === "dark");
  }, [theme]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  const theme = useUIStore((s) => s.theme);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync theme={theme} />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
