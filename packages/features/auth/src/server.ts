// Server-only exports
export { authRouter } from "./router";
export { syncUser } from "./sync-user";

// Re-exports from Clerk (server-only)
export {
  auth,
  clerkClient,
  currentUser,
  verifyToken,
} from "@clerk/nextjs/server";
