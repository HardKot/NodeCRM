const cluster = require('node:cluster');
const { Instance } = require('./instance');
const { dirname } = require('node:path');
const { Logger } = require('../core/logger');
const { Types } = require('../utils');
class ApplicationError extends Error {
}
class Application {
    module;
    clusterCount;
    plugins;
    stdout;
    stderr;
    static async run(config) {
        const application = new Application(await config.module, config.clusterCount ?? 0, config.plugins ?? [], config.stdout ?? process.stdout, config.stderr ?? process.stderr);
        return application.run();
    }
    prefix;
    logger;
    constructor(module, clusterCount, plugins, stdout, stderr) {
        this.module = module;
        this.clusterCount = clusterCount;
        this.plugins = plugins;
        this.stdout = stdout;
        this.stderr = stderr;
        this.prefix = `Instance@${dirname(process.cwd())}`;
        if (cluster.isWorker)
            this.prefix = `Worker#${cluster.worker?.id}`;
        this.logger = new Logger(this.prefix, this.stdout, this.stderr);
    }
    async run() {
        if (this.clusterCount && cluster.isPrimary)
            return this.master();
        return this.worker();
    }
    async master() {
        if (!cluster.isPrimary)
            throw new ApplicationError('Not a master process');
        if (!this.clusterCount)
            throw new ApplicationError('Not a cluster count');
        const workers = new Array(this.clusterCount);
        for (let i = 0; i < this.clusterCount; i += 1) {
            workers[i] = cluster.fork();
        }
    }
    async worker() {
        let module;
        if (Types.isFunction(this.module)) {
            module = await this.module();
        }
        else {
            module = await this.module;
        }
        await Instance.create(module, this.logger, this.plugins);
    }
}

exports.Application = Application;
exports.ApplicationError = ApplicationError;