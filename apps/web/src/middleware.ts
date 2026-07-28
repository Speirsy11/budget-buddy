import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes that must not require a Clerk session.
 *
 * The API entries here are not unauthenticated: the Stripe webhook verifies
 * its signature and the cron route requires a bearer secret. They are exempt
 * because neither caller is a signed-in user.
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/stripe/webhook",
  "/api/cron(.*)",
  "/demo(.*)",
]);

/**
 * Mirrors `devAuthUserId()` in server/dev-auth.ts. Duplicated rather than
 * imported because middleware runs on the edge runtime, where importing the
 * server module would pull in its dependencies. Both checks require
 * NODE_ENV === "development", so neither can be enabled in a production build.
 */
function isDevAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    Boolean(process.env.DEV_AUTH_USER_ID?.trim())
  );
}

/**
 * Clerk's middleware always runs, even for the dev test session.
 *
 * Skipping it outright breaks every other caller of `auth()` — including the
 * `<SignedIn>` / `<SignedOut>` components on the public landing page, which
 * throw "auth() was called but Clerk can't detect usage of clerkMiddleware()".
 * So the bypass is narrow: only the `protect()` call is skipped, leaving
 * `auth()` working everywhere and simply reporting no session.
 */
export default clerkMiddleware(async (auth, req) => {
  if (isDevAuthEnabled()) return;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
