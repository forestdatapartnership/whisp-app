import { SystemCode, getSystemCodeInfo, formatString } from './systemCodes';

export class SystemError extends Error {
  public readonly systemCode: SystemCode;
  public readonly formatArgs?: (string | number)[];
  public readonly cause?: string;

  constructor(
    systemCode: SystemCode, 
    formatArgs?: (string | number)[],
    cause?: string
  ) {
    const codeInfo = getSystemCodeInfo(systemCode);
    const finalMessage = formatArgs && formatArgs.length > 0
      ? formatString(codeInfo.message, ...formatArgs)
      : codeInfo.message;
    
    super(finalMessage);
    
    this.name = 'SystemError';
    this.systemCode = systemCode;
    this.formatArgs = formatArgs;
    this.cause = cause;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemError);
    }
  }
}
