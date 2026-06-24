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
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| LOG |', ...data);
    super.log(...args);
  }
  info(...data) {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| INFO |', ...data);
    super.info(...args);
  }
  warn(...data) {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| WARN |', ...data);
    super.warn(...args);
  }
  error(...data) {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| ERROR |', ...data);
    super.error(...args);
  }
  extend(prefix) {
    const child = new Logger({
      prefix,
      stdout: this.stdout,
      stderr: this.stderr,
    });

    Object.setPrototypeOf(child, this);
    return child;
  }
}
