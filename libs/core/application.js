const cluster = require('node:cluster');
const { Instance } = require('./instance.js');

class ApplicationError extends Error {}

class Application {
  static build() {
    return new ApplicationBuilder();
  }

  constructor(config = {}) {
    this.path = config.path ?? process.cwd();
    this.clusterCount = config.clusterCount ?? 0;
    this.context = config.context ?? {};
    this.watchTimeout = config.watchTimeout ?? 500;
    this.moduleExportRule = config.moduleExportRule;
    this.stdout = config.stdout ?? process.stdout;
    this.stderr = config.stderr ?? process.stderr;
    this.plugins = config.plugins ?? [];
    this.moduleType = config.moduleType;
    this.appModule = config.appModule;
  }

  async run() {
    if (this.clusterCount && cluster.isPrimary) return this.master();
    if (cluster.isWorker) return this.worker(`Worker#${cluster.worker?.id}`);
    return this.worker();
  }

  async master() {
    if (!cluster.isPrimary) throw ApplicationError('Not a master process');
    if (!this.clusterCount) throw ApplicationError('Not a cluster count');
    const workers = new Array(this.clusterCount);

    for (let i = 0; i < this.clusterCount; i += 1) {
      workers[i] = cluster.fork();
    }
  }

  async worker(prefix = null) {
    return await Instance.run({
      context: this.context,
      path: this.path,
      prefix: prefix,
      watchTimeout: this.watchTimeout,
      moduleExportRule: this.moduleExportRule,
      stdout: this.stdout,
      stderr: this.stderr,
      plugins: this.plugins,
      module: this.appModule,
    });
  }
}

class ApplicationBuilder {
  #config = {};

  path(path) {
    this.#config.path = path;
    return this;
  }
  appModule(module) {
    this.#config.appModule = module;
    return this;
  }

  clusterCount(count) {
    this.#config.clusterCount = count;
    return this;
  }
  context(context) {
    this.#config.context = context;
    return this;
  }
  watchTimeout(timeout) {
    this.#config.watchTimeout = timeout;
    return this;
  }
  exportModuleRule(rule) {
    this.#config.exortModuleRule = rule;
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
