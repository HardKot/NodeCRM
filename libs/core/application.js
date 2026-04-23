const path = require('node:path');
const cluster = require('node:cluster');

const { Logger } = require('./logger');
const { Config } = require('./config');
const { Container } = require('./container');
const { BeanRegistry } = require('./beanRegistry');
const { HttpServer } = require('../httpServer/httpServer');

class Application {
    constructor(stdout, stderr) {
        this.prefix = `Instance@${path.dirname(process.cwd())}`;
        if (cluster.isWorker) this.prefix = `Worker#${cluster.worker?.id}`;

        this.logger = new Logger(this.prefix, stdout, stderr);

        this.container = new Container(this);
        this.beanRegistry = new BeanRegistry(this);
        this.config = new Config(this);
        this.httpServer = new HttpServer(this);

        Object.freeze(this);
    }
}


exports.Application = Application;