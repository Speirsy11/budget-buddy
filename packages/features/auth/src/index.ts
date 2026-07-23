export { UserButton } from "./components/user-button";
export { SignInButton } from "./components/sign-in-button";
export { SignUpButton } from "./components/sign-up-button";

export { useCurrentUser } from "./hooks/use-current-user";

// Re-exports from Clerk (client-safe)
export {
  SignIn,
  SignUp,
  ClerkProvider,
  useAuth,
  useUser,
  useClerk,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
