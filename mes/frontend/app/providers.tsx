"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchInterval: 2000, staleTime: 1000, retry: 1 } },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ConfigProvider theme={{ token: { colorPrimary: "#1677ff", borderRadius: 6 } }}>
        {children}
      </ConfigProvider>
    </QueryClientProvider>
  );
}
