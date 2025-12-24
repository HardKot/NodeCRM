class AppLogger {
  constructor(config = {}) {
    this.prefix = config.prefix ?? '';
  }

  log() {
    this.print('log', arguments, Date.now());
  }
  info() {
    const args = ['info', arguments, Date.now()];
    this.print.call(this, args);
    this.write.call(this, args);
  }
  warn() {
    const args = ['info', arguments, Date.now()];
    this.print.call(this, args);
    this.write.call(this, args);
  }
  error() {
    const args = ['info', arguments, Date.now()];
    this.print.call(this, args);
    this.write.call(this, args);
  }

  async print(level, args, time) {
    const message = `${time} | ${this.prefix} | ${level.toUpperCase()} : ${Array.from(arguments).join(' ')}`;
    const print = console[level] ?? console.log;

    print(message.replace('| | ', ''));
  }

  async write() {
    console.warn('Writing logs is not implemented yet.');
  }

  create(prefix) {
    return new AppLogger({ prefix: `${prefix}` });
  }

  static getTime() {
    const now = new Date();
    return now.toISOString();
  }
}

export { AppLogger };
