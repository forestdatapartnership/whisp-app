import { SystemCode, getSystemCodeInfo, formatString } from './systemCodes';

export class SystemError extends Error {
  public readonly systemCode: SystemCode;
  public readonly formatArgs?: (string | number)[];
  public readonly innerError?: Error;

  constructor(
    systemCode: SystemCode, 
    formatArgs?: (string | number)[], 
    message?: string,
    innerError?: Error
  ) {
    const codeInfo = getSystemCodeInfo(systemCode);
    const finalMessage = message || (formatArgs ? formatString(codeInfo.message, ...formatArgs) : codeInfo.message);
    
    // Use modern 'cause' property if supported (ES2022)
    super(finalMessage, innerError ? { cause: innerError } : undefined);
    
    this.name = 'SystemError';
    this.systemCode = systemCode;
    this.formatArgs = formatArgs;
    this.innerError = innerError;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemError);
    }
  }
}
