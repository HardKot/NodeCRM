import { Console } from 'node:console';
import * as utils from 'node:util';

import { LoggerLevel } from './enums.js';

import type { ILogger, LevelEnumValue } from './interfaces/index.js';

export { Logger };

interface LoggerProps {
  prefix: string;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;

  level?: LevelEnumValue;
}

class Logger extends Console implements ILogger {
  #stdout: NodeJS.WriteStream;
  #stderr: NodeJS.WriteStream;

  prefix: string;
  level: LevelEnumValue;
  transform = (v: any) => `${v}`;

  constructor({ prefix, stdout, stderr, level }: LoggerProps) {
    super({ stdout, stderr });
    this.prefix = prefix;
    this.#stdout = stdout;
    this.#stderr = stderr;
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

  #isSkip(value: LevelEnumValue) {
    return value < this.level;
  }
}
