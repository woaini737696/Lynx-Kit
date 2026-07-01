"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { trpc, trpcLink } from "@/lib/trpc";

/**
 * 全局 Provider：tRPC + React Query + Toaster
 * 单独拆为客户端组件，便于根 layout（Server Component）导出 metadata
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClientRef = React.useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          // 避免未登录时反复重试
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  const trpcClient = React.useMemo(
    () =>
      trpc.createClient({
        links: [trpcLink],
      }),
    []
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClientRef.current}>
      <QueryClientProvider client={queryClientRef.current}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
