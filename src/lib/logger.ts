/*
  Simple logger helper to centralize logging across the application.
  - In development it prints debug/info/warn/error messages.
  - In production it only prints warn/error messages to avoid noise and improve performance.
  - Supports optional namespaces to easily filter logs per module.
*/

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMethod = (...args: unknown[]) => void;

interface LoggerInterface {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

const isProd =
  (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production') ||
  process.env.NODE_ENV === 'production';

function createLogger(namespace?: string): LoggerInterface {
  // Prefix logs with namespace if provided
  const prefix = namespace ? `[${namespace}]` : '';

  const base = {
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
  } as LoggerInterface;

  if (isProd) {
    // In production, ignore debug & info
    return {
      ...base,
      debug: () => {},
      info: () => {},
    };
  }

  return {
    ...base,
    debug: (...args: unknown[]) => console.debug(prefix, ...args),
    info: (...args: unknown[]) => console.info(prefix, ...args),
  };
}

// Default logger without namespace
const defaultLogger = createLogger();

export { createLogger };
export default defaultLogger;