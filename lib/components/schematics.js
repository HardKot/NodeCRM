import { logger } from '../common/logger.js';
import path from 'path';
import { moduleReader } from './moduleReader.js';
import { create, getAll, getById, remove, runQuery, update } from './repository.js';

const DOMAIN_DIR = path.join(process.cwd(), 'app', 'domains');
const SCHEMAS_DIR = path.join(process.cwd(), 'app', 'domains');

export const appSchemas = [];
export const appRepositories = [];

export async function run() {
  logger.info('Запуск чтения схем...');

  const domainModules = await moduleReader(DOMAIN_DIR);
  const schemaModules = await moduleReader(SCHEMAS_DIR);

  const schemas = domainModules
    .concat(schemaModules)
    .filter(modules => modules.type === 'script')
    .map(module => readSchema(module))
    .filter(Boolean);

  appSchemas.concat(schemas);

  logger.info(`Схемы прочитаны. Всего схем: ${schemas.length}`);
}

function readSchema(module) {
  const code = module.build();
  if (!code.schema) {
    logger.warn('Модуль не содержит schema экспорт:', { module });
    return null;
  }

  const schema = code.schema;
  const tableName = code.tableName || module.name;
  const primaryKey = code.primaryKey || 'id';
  const indexes = Array.isArray(code.indexes) ? code.indexes : [];
  const relations = Array.isArray(code.relations) ? code.relations : [];
  const hooks = {
    preCreate: code.onPreCreate,
    postCreate: code.onPostCreate,

    preRead: code.onPreRead,
    postRead: code.onPostRead,

    preUpdate: code.onPreUpdate,
    postUpdate: code.onPostUpdate,

    preDelete: code.onPreDelete,
    postDelete: code.onPostDelete,
  };

  const repository = {
    getById: id => getById(schema, id, hooks),
    getAll: () => getAll(schema, hooks),
    create: data => create(schema, data, hooks),
    update: (id, data) => update(schema, id, data, hooks),
    delete: id => remove(schema, id, hooks),
  };

  for (const methodName in code.repository ?? {}) {
    const method = code.repository[methodName];

    if (typeof method === 'function') {
      repository[methodName] = async function () {
        const query = method.apply(null, arguments);
        return await runQuery(schema, query, hooks);
      };
    }
  }

  return {
    schema,
    tableName,
    primaryKey,
    indexes,
    relations,
    hooks,
    repository,
  };
}
