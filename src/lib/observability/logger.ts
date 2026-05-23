import "server-only";

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<
  string,
  string | number | boolean | null | undefined | string[] | number[]
>;

export function logInfo(event: string, context: LogContext = {}) {
  writeLog("info", event, context);
}

export function logWarn(event: string, context: LogContext = {}) {
  writeLog("warn", event, context);
}

export function logError(
  event: string,
  error: unknown,
  context: LogContext = {}
) {
  writeLog("error", event, {
    ...context,
    ...errorContext(error),
  });
}

function writeLog(level: LogLevel, event: string, context: LogContext) {
  const payload = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...context,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.log(payload);
}

function errorContext(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  return {
    errorMessage: "Unexpected non-error throw.",
  };
}
