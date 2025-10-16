import path from 'node:path';
import { logger } from '../src/common/logger.js';
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';

const APP_DIR = path.join(process.cwd(), 'app');
const APP_NAME = path.basename(process.cwd());

function run({ count = 1 }) {
  const maxCount = availableParallelism();

  if (count < 1 || count > maxCount) {
    logger.error(`Некорректное количество экземпляров: ${count}. Допустимо от 1 до ${maxCount}.`);
    process.exit(1);
  }

  logger.info(`Запуск приложения ${APP_NAME} из ${APP_DIR} в количестве ${count} экземпляров...`);

  const processes = [];

  for (let i = 0; i < count; i++) {
    const env = { ...process.env, INSTANCE_ID: i + 1 };
    cluster.fork(env);
  }
}

function start() {
  logger.info(`Запуск экземпляра ${process.env.INSTANCE_ID} приложения ${APP_NAME}...`);
}

export default function (count = 1) {
  if (cluster.isPrimary) {
    run({ count });
  } else {
    start();
  }
}
