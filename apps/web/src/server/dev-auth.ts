/**
 * Development-only test session.
 *
 * Setting DEV_AUTH_USER_ID signs every request in as that user without going
 * through Clerk. It exists so the dashboard can be opened and checked without
 * a real login — visual review, screenshots, poking at a page after changing
 * it — not as a general convenience.
 *
 * The safety story, in order:
 *
 *   1. It is ignored unless NODE_ENV is exactly "development". A production
 *      build cannot switch it on, whatever is in the environment.
 *   2. If it is somehow set in a production build, `assertDevAuthNotInProduction`
 *      throws at startup rather than quietly serving an unauthenticated app.
 *      Failing to boot is the correct outcome for an auth bypass in production.
 *   3. The user ID must already exist in the database — this grants a session
 *      as an existing seeded user, it does not create one.
 *
 * Never set this in a deployed environment.
 */

const ENV_VAR = "DEV_AUTH_USER_ID";

function rawValue(): string | undefined {
  // Read directly rather than by computed key: Next.js inlines literal
  // process.env accesses, and a dynamic lookup would not be replaced.
  return process.env.DEV_AUTH_USER_ID?.trim() || undefined;
}

/**
 * Fail the process if an auth bypass is configured in a production build.
 *
 * Called from instrumentation so it runs once at startup, before any request
 * is served.
 */
export function assertDevAuthNotInProduction(): void {
  if (process.env.NODE_ENV === "production" && rawValue()) {
    throw new Error(
      `${ENV_VAR} is set in a production build. This variable bypasses ` +
        `authentication entirely and must never be set outside local ` +
        `development. Refusing to start.`
    );
  }
}

/**
 * The impersonated user ID, or null when the bypass is not active.
 *
 * Returns null in every environment except local development, so callers can
 * use it unconditionally.
 */
export function devAuthUserId(): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  return rawValue() ?? null;
}

export function isDevAuthEnabled(): boolean {
  return devAuthUserId() !== null;
}
