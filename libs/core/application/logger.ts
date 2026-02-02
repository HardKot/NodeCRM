import * as console from 'node:console';

class Logger extends console.Console {
  constructor(
    public readonly prefix: string,
    private readonly stdout: NodeJS.WriteStream,
    private readonly stderr?: NodeJS.WriteStream
  ) {
    super(stdout, stderr);
  }

  log(...data: any[]) {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| LOG |', ...data);
    super.log(...args);
  }
  info(...data: any[]) {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| INFO |', ...data);
    super.info(...args);
  }
  warn(...data: any[]) {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| WARN |', ...data);
    super.warn(...args);
  }
  error(...data: any[]) {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| ERROR |', ...data);
    super.error(...args);
  }

  extend(prefix: string) {
    return new Logger(prefix, this.stdout, this.stderr);
  }
}

export { Logger };
