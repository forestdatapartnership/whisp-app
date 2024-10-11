export const compose = (...handlers: Function[]) => {
    return (handler: Function) =>
      handlers.reduceRight((prevHandler, currentHandler) => currentHandler(prevHandler), handler);
  };