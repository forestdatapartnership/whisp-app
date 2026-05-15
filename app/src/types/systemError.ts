import { SystemCode, formatSystemMessage } from './systemCodes';

export class SystemError extends Error {
  public readonly systemCode: SystemCode;
  public readonly formatArgs?: (string | number)[];
  public readonly cause?: string;

  constructor(systemCode: SystemCode, formatArgs?: (string | number)[], cause?: string) {
    super(formatSystemMessage(systemCode, formatArgs));
    this.name = 'SystemError';
    this.systemCode = systemCode;
    this.formatArgs = formatArgs;
    this.cause = cause;
    Error.captureStackTrace?.(this, SystemError);
  }
}
