import console from 'node:console';

class Logger extends console.Console {
  #config;

  constructor(config = {}) {
    super(config.stdout, config.stderr);
    this.prefix = config.prefix;
    this.#config = config;
  }

  log() {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| LOG |', ...arguments);
    super.log(...args);
  }
  info() {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| INFO |', ...arguments);
    super.info(...args);
  }
  warn() {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| WARN |', ...arguments);
    super.warn(...args);
  }
  error() {
    const args = [Date.now().toString()];
    if (this.prefix) args.push(`| ${this.prefix}`);
    args.push('| ERROR |', ...arguments);
    super.error(...args);
  }

  extend(prefix) {
    return new Logger({ ...this.#config, prefix: `${prefix}` });
  }
}

export { Logger };
