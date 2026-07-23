import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@finance/api-router";
import { createContext } from "@/server/trpc";

const handler = async (req: Request) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export { handler as GET, handler as POST };
