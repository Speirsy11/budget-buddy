import pino, { type Logger as PinoLogger, type LoggerOptions } from "pino";

/**
 * Log levels from least to most verbose
 */
export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export type Logger = PinoLogger;

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

/**
 * Detect if running in a bundled environment (Next.js, webpack, etc.)
 * where pino transports with worker threads won't work.
 */
function isBundledEnvironment(): boolean {
  // Next.js sets this in server components
  if (typeof process !== "undefined" && process.env.NEXT_RUNTIME) {
    return true;
  }
  // Check for webpack/turbopack bundling indicators
  // @ts-expect-error - __webpack_require__ is defined by webpack/turbopack
  if (typeof __webpack_require__ !== "undefined") {
    return true;
  }
  return false;
}

/**
 * - Production: info (less verbose, better performance)
 * - Development: debug (more verbose for debugging)
 * - Test: silent (no logs during tests unless LOG_LEVEL is set)
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  if (envLevel) {
    return envLevel;
  }
  if (isTest) {
    return "silent" as unknown as LogLevel;
  }
  return isProduction ? "info" : "debug";
}

function createLoggerOptions(): LoggerOptions {
  const level = getLogLevel();

  const baseOptions: LoggerOptions = {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "password",
        "secret",
        "token",
        "authorization",
        "cookie",
        "apiKey",
        "api_key",
        "accessToken",
        "refreshToken",
        "*.password",
        "*.secret",
        "*.token",
        "input.password",
        "input.secret",
        "creditCard",
        "ssn",
      ],
      censor: "[REDACTED]",
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  };

  // Skip transports in bundled environments (Next.js) where worker threads don't work
  if (!isProduction && !isTest && !isBundledEnvironment()) {
    return {
      ...baseOptions,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
    };
  }

  return baseOptions;
}

/**
 * @example
 * import { logger } from "@finance/logger";
 *
 * logger.info({ userId: "123" }, "User logged in");
 * logger.error({ err: error }, "Failed to process transaction");
 * logger.debug({ input }, "Processing request");
 */
export const logger = pino(createLoggerOptions());

/**
 * Use this when you want to add persistent context to all logs in a module
 *
 * @example
 * const log = logger.child({ module: "transactions" });
 * log.info({ transactionId: "123" }, "Processing transaction");
 */
export const child = logger.child.bind(logger);

/**
 * @example
 * const timer = createTimer();
 * await doSomething();
 * logger.info({ durationMs: timer.elapsed() }, "Operation complete");
 */
export function createTimer(): { elapsed: () => number } {
  const start = performance.now();
  return {
    elapsed: () => Math.round(performance.now() - start),
  };
}
