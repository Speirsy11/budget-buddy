import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./client";
import superjson from "superjson";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { isMockAuthMode } from "@/lib/auth/mock-mode";

function getBaseUrl(): string {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;

  if (typeof apiUrl === "string" && apiUrl.length > 0) {
    if (
      !__DEV__ &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(apiUrl)
    ) {
      throw new Error(
        "Mobile API URL must not point at localhost in release builds."
      );
    }

    return apiUrl;
  }

  if (__DEV__) {
    return "http://localhost:3000";
  }

  throw new Error("Mobile API URL is missing for this release build.");
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  if (isMockAuthMode) {
    return <BaseTRPCProvider>{children}</BaseTRPCProvider>;
  }

  return <AuthenticatedTRPCProvider>{children}</AuthenticatedTRPCProvider>;
}

function AuthenticatedTRPCProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();

  return (
    <BaseTRPCProvider getToken={() => auth.getToken()}>
      {children}
    </BaseTRPCProvider>
  );
}

function BaseTRPCProvider({
  children,
  getToken,
}: {
  children: React.ReactNode;
  getToken?: () => Promise<string | null>;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          async headers() {
            const token = await getToken?.();
            return {
              Authorization: token ? `Bearer ${token}` : "",
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
