import winston from "winston";
import { getLogLevel } from "./utils/configUtils";

export type LogFunction = {
  (level: 'debug' | 'info' | 'warn' | 'error', message: string, source?: string, meta?: Record<string, any>): void;
  enrich(enrichments: Record<string, any>): void;
};

const gcpSeverityFormat = winston.format((info) => {
  const levelToSeverity: Record<string, string> = {
    'error': 'ERROR',
    'warn': 'WARNING',
    'info': 'INFO',
    'debug': 'DEBUG'
  };
  info.severity = levelToSeverity[info.level] || 'DEFAULT';
  delete (info as any).level;
  return info;
});

export function useLogger(): winston.Logger {
  return winston.createLogger({
    level: getLogLevel(),
    format: winston.format.combine(
      gcpSeverityFormat(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
    ],
  });
}
