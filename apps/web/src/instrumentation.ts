import { assertDevAuthNotInProduction } from "./server/dev-auth";

/**
 * Runs once when the server starts, before any request is handled.
 *
 * The only job here is to refuse to boot if an authentication bypass is
 * configured in a production build. A crash on startup is loud and obvious;
 * quietly serving an app with authentication disabled is not.
 */
export function register() {
  assertDevAuthNotInProduction();
}
