import { LoggerLevel } from '#constant';
import { Console } from 'node:console';
import * as utils from 'node:util';

export { Logger };

interface LoggerProps {
  prefix: string;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;

  level?: ILogerLevelValue;
}

class Logger extends Console implements ILogger {
  #stdout: NodeJS.WriteStream;
  #stderr: NodeJS.WriteStream;

  readonly prefix: string;
  readonly level: ILogerLevelValue;
  transform: (arg: any) => string;

  constructor({ prefix, stdout, stderr, level }: LoggerProps) {
    super({ stdout, stderr });
    this.prefix = prefix;
    this.#stdout = stdout;
    this.#stderr = stderr;
    this.transform = (v: any) => `${v}`;
    this.level = level ?? LoggerLevel.DEBUG;
  }

  async debug(...data: any[]) {
    if (this.#isSkip(LoggerLevel.DEBUG)) return;
    const args = this.#buildMessage(new Date(), 'debug', data);
    super.debug(...args);
  }

  async log(...data: any[]) {
    if (this.#isSkip(LoggerLevel.LOG)) return;
    const args = this.#buildMessage(new Date(), 'log', data);
    super.log(...args);
  }

  async info(...data: any[]) {
    if (this.#isSkip(LoggerLevel.INFO)) return;
    const args = this.#buildMessage(new Date(), 'info', data);
    super.info(...args);
  }

  async warn(...data: any[]) {
    if (this.#isSkip(LoggerLevel.WARN)) return;
    const args = this.#buildMessage(new Date(), 'warn', data);
    super.warn(...args);
  }

  async error(...data: any[]) {
    if (this.#isSkip(LoggerLevel.ERROR)) return;
    const args = this.#buildMessage(new Date(), 'error', data);
    super.error(...args);
  }

  extend(prefix: string) {
    const child = new Logger({
      prefix,
      stdout: this.#stdout,
      stderr: this.#stderr,
      level: this.level,
    });
    Object.setPrototypeOf(child, this);
    return child;
  }

  #buildMessage(time: Date, level: string, data: any[]) {
    return [utils.format('%s | %s | %s |', time, this.prefix, level), ...data.map((it) => this.transform(it))];
  }

  #isSkip(value: ILogerLevelValue) {
    return value < this.level;
  }
}
