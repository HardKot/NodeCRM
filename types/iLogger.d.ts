declare interface ILogger {
  readonly prefix: string;
  readonly level: ILogerLevelValue;
  transform: (arg: any) => string;

  debug(...args: any[]): Promise<void>;
  log(...args: any[]): Promise<void>;
  info(...args: any[]): Promise<void>;
  warn(...args: any[]): Promise<void>;
  error(...args: any[]): Promise<void>;

  extend(prefix: string): ILogger;
}
