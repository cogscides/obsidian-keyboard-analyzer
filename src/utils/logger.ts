import { getLogLevel, isDevLoggingEnabled } from './runtimeConfig'

type Level = 'debug' | 'info' | 'warn' | 'error'

const levelOrder: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function shouldLog(level: Level): boolean {
  if (!isDevLoggingEnabled()) return false
  const current = getLogLevel()
  return levelOrder[level] >= levelOrder[current]
}

function format(args: unknown[]) {
  try {
    return args
  } catch {
    return args
  }
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug('[KB]', ...format(args))
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.info('[KB]', ...format(args))
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn('[KB]', ...format(args))
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) console.error('[KB]', ...format(args))
  },
}

export default logger

