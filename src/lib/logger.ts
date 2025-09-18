import winston from "winston";
import { getLogLevel } from "./utils/configUtils";

export type LogFunction = (level: 'debug' | 'info' | 'warn' | 'error', message: string, source?: string, meta?: Record<string, any>) => void;

export function useLogger(): winston.Logger {
  return winston.createLogger({
    level: getLogLevel(),
    format: winston.format.json(),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.json()
        ),
      }),
    ],
  });
}
