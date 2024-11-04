export function compose<T>(...handlers: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => handlers.reduce((prev, handler) => handler(prev), arg);
}
