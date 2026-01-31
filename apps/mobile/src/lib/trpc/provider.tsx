import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./client";
import superjson from "superjson";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";

function getBaseUrl(): string {
  // Get the API URL from environment or use a default
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (apiUrl) {
    return apiUrl as string;
  }

  // For development, use your local machine's IP
  // You'll need to set this in app.json or env
  return "http://localhost:3000";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (trpc as any).createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          async headers() {
            const token = await getToken();
            return {
              Authorization: token ? `Bearer ${token}` : "",
            };
          },
        }),
      ],
    })
  );

  // Use explicit any to work around tRPC typing issues with untyped client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TRPCProviderComponent = (trpc as any).Provider;

  return (
    <TRPCProviderComponent client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TRPCProviderComponent>
  );
}
