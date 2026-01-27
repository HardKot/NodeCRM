const cluster = require('node:cluster');
const { Instance } = require('./instance.js');
const { dirname } = require('node:path');

class ApplicationError extends Error {}

class Application {
  static build() {
    return new ApplicationBuilder();
  }

  constructor(config = {}) {
    this.clusterCount = config.clusterCount ?? 0;
    this.stdout = config.stdout ?? process.stdout;
    this.stderr = config.stderr ?? process.stderr;
    this.plugins = config.plugins ?? [];
    this.module = config.module;
    this.prefix = `Instance@${dirname(process.cwd())}`;
    if (cluster.isWorker) this.prefix = `Worker#${cluster.worker?.id}`;
  }

  async run() {
    if (this.clusterCount && cluster.isPrimary) return this.master();
    return this.worker();
  }

  async master() {
    if (!cluster.isPrimary) throw new ApplicationError('Not a master process');
    if (!this.clusterCount) throw new ApplicationError('Not a cluster count');
    const workers = new Array(this.clusterCount);

    for (let i = 0; i < this.clusterCount; i += 1) {
      workers[i] = cluster.fork();
    }
  }

  async worker() {
    if (this.module instanceof Promise) {
      this.module = await this.module;
    }
    return await Instance.run(this);
  }
}

class ApplicationBuilder {
  #config = {};

  module(module) {
    this.#config.module = module;
    return this;
  }

  clusterCount(count) {
    this.#config.clusterCount = count;
    return this;
  }

  stdout(stdout) {
    this.#config.stdout = stdout;
    return this;
  }
  stderr(stderr) {
    this.#config.stderr = stderr;
    return this;
  }
  plugins(plugins) {
    this.#config.plugins = plugins;
    return this;
  }

  run() {
    const app = new Application(this.#config);
    return app.run();
  }
}

module.exports = { Application, ApplicationError };
