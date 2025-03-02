const logLevelMap = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
} as const;

const numberToLogLevel = {
  1: 'DEBUG',
  2: 'INFO',
  3: 'WARN',
  4: 'ERROR',
} as const;

type LogLevel = keyof typeof logLevelMap;

const logLevel: LogLevel = (process.env['LOG_LEVEL'] || 'INFO') as LogLevel;


const log = (level: 1 | 2 | 3 | 4 = 1, message: string, ...args: any[]): void => {
  if (level >= logLevelMap[logLevel]) {
    console.log(`[${numberToLogLevel[level]}] ${message}`, ...args);
  }
}

export const logger = {
  debug: (message: string, ...args: any[]) => log(logLevelMap.DEBUG, message, ...args),
  info: (message: string, ...args: any[]) => log(logLevelMap.INFO, message, ...args),
  warn: (message: string, ...args: any[]) => log(logLevelMap.WARN, message, ...args),
  error: (message: string, ...args: any[]) => log(logLevelMap.ERROR, message, ...args),
}