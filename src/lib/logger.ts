import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      ),
    }),
  ],
});

function log(level: string, message: string, source: any = null, metadata = {}) {
    const meta = {
      ...metadata,
      ...(source ? { source } : {}),
    };
  
    logger.log(level, message, meta);
}

function info(message: string, source: any = null, metadata = {}) {
    log ('info', message, source, metadata);

}

function warn(message: string, source: any = null, metadata = {}){
    log ('warn', message, source, metadata);
}

function error(message:string, source: any = null, metadata = {}){
    log ('error', message, source, metadata);
}

export {logger, log, info, warn, error};