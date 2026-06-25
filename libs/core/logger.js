import { Console } from 'node:console';

export { Logger };

class Logger extends Console {
  constructor({ prefix, stdout, stderr, level }) {
    super(stdout ?? process.stdout, stderr ?? process.stderr);
    this.prefix = prefix;
    this.stdout = stdout;
    this.stderr = stderr;
    this.level = level ?? 'log';
  }
  log(...data) {
    const args = this.#buildMessage(new Date(), 'log', data);
    super.log(...args);
  }
  info(...data) {
    const args = this.#buildMessage(new Date(), 'info', data);
    super.info(...args);
  }
  warn(...data) {
    const args = this.#buildMessage(new Date(), 'warn', data);
    super.warn(...args);
  }
  error(...data) {
    const args = this.#buildMessage(new Date(), 'error', data);
    super.error(...args);
  }
  extend(prefix) {
    const child = new Logger({
      prefix,
      stdout: this.stdout,
      stderr: this.stderr,
      level: this.level,
    });
    Object.setPrototypeOf(child, this);
    return child;
  }

  transform(v) {
    return v;
  }

  #buildMessage(time, level, data) {
    const args = [time.getTime()];

    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push(`| ${level.toUpperCase()} |`, ...data.map(it => this.transform(it)));
    return args;
  }
}
