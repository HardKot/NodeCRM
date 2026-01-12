import os from 'node:os';
import cluster from 'node:cluster';
import process from 'node:process';
import { Space } from './space.js';
import { Container } from './container.js';

function App(config) {
  const logger = config.logger ?? console;
  const space = new Space({
    logger: config.logger,
    path: config.path,
    watchTimeout: config.watchTimeout,
    context: config.context,
  });

  const container = new Container();

  if (cluster.isPrimary) {
    master({ logger, space });
  } else {
    fork({ space, container, logger });
  }
}

async function master({ logger, space }) {
  const numCPUs = os.availableParallelism();

  logger.info(`Master process is running with ${numCPUs} CPUs`);

  for (let i = 0; i < numCPUs; i++) {
    logger.info(`Forking worker ${i + 1}/${numCPUs}`);
    createWorker({ space, logger });
  }

  space.watch();
}

function createWorker({ space, logger }) {
  const worker = cluster.fork();

  const unSubscribe = space.onUpdate(() => {
    worker.send({ type: 'space', event: 'update' });
  });

  worker.on('exit', (code, signal) => {
    logger.info(`Worker process exited with code ${code} and signal ${signal}`);
    unSubscribe();
  });

  return worker;
}

async function fork({ space, container, logger }) {
  logger.info(`Worker process started with PID ${process.pid}`);

  process.on('message', async message => {});
}

export { App };
