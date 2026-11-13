import winston, { format, transports } from 'winston';
import { envConfig } from '../config/env';

const LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 } as const;
const LEVEL_NAMES = new Set<string>(Object.keys(LEVELS));
const DEFAULT_ENABLED_LEVELS = ['error', 'warn', 'info'];

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

function parseLevels(raw: string): Set<string> {
  const value = raw.trim().toLowerCase();
  if (value === 'all') return new Set(LEVEL_NAMES);

  const picked = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => LEVEL_NAMES.has(item));

  return new Set(picked.length > 0 ? picked : DEFAULT_ENABLED_LEVELS);
}

const enabledLevels = parseLevels(String(envConfig.logLevel));
const dropDisabled = format((info) => (enabledLevels.has(info.level) ? info : false));

function getStack(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'stack' in error) {
    return typeof error.stack === 'string' ? error.stack : undefined;
  }
  return undefined;
}

const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ level, message, timestamp, error, ...rest }) => {
    const stack = getStack(error);
    const meta = error !== undefined && !stack ? { ...rest, error } : rest;
    const extras = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${extras}${stack ? `\n${stack}` : ''}`;
  }),
);

const jsonFormat = format.combine(format.timestamp(), format.json());

const baseLogger = winston.createLogger({
  levels: LEVELS,
  level: 'debug',
  format: dropDisabled(),
  transports: [
    new transports.Console({
      format: envConfig.nodeEnv === 'development' ? devFormat : jsonFormat,
    }),
  ],
});

function errorMeta(err: unknown): Record<string, unknown> {
  if (err === undefined) return {};
  if (err instanceof Error) {
    return { error: { name: err.name, message: err.message, stack: err.stack } };
  }
  return { error: err };
}

type Meta = Record<string, unknown>;

export const logger = {
  error: (message: string, err?: unknown): void => {
    baseLogger.error(message, errorMeta(err));
  },
  warn: (message: string, meta?: Meta): void => {
    baseLogger.warn(message, meta);
  },
  info: (message: string, meta?: Meta): void => {
    baseLogger.info(message, meta);
  },
  http: (message: string, meta?: Meta): void => {
    baseLogger.http(message, meta);
  },
  debug: (message: string, meta?: Meta): void => {
    baseLogger.debug(message, meta);
  },
};

export const httpLogStream = {
  write: (line: string): void => {
    baseLogger.http(line.trim());
  },
};