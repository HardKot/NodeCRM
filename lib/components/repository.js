import { QueryBuilder } from './queryBuilder.js';
import { AsyncLocalStorage } from 'node:async_hooks';

export const repositoryConnectionContext = new AsyncLocalStorage();
function getConnection() {
  const connection = repositoryConnectionContext.getStore();
  if (!connection) {
    throw new Error('No database connection in context');
  }
  return connection;
}

export async function getById(schema, id, hooks = {}) {
  const connection = getConnection();

  const qb = new QueryBuilder(schema.tableName);
  const query = qb.where(schema.tableName + '.id', '$1').toSql();

  await hooks.preRead?.({ name: 'getById', args: arguments });
  const result = await connection.query(query.text, [id]);
  const model = result.rows[0];
  await hooks.postRead?.({ name: 'getById', args: arguments, result: [model] });

  return model;
}

export async function getAll(schema, hooks = {}) {
  const connection = getConnection();

  const qb = new QueryBuilder(schema.tableName);
  const query = qb.toSql();

  await hooks.preRead?.({ name: 'getAll' });
  const result = await connection.query(query.text);
  const models = result.rows;
  await hooks.postRead?.({ name: 'getAll', result: models });

  return models;
}

export async function runQuery(schema, query, hooks = {}) {
  const connection = getConnection();

  await hooks.preRead?.({ name: 'runQuery' });
  const res = await connection.query(query);
  const models = res.rows;

  await hooks.postRead?.({ name: 'runQuery', result: models });

  return models;
}

export async function create(schema, data, hooks) {
  const connection = getConnection();

  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map((_, index) => `$${index + 1}`);

  const query = {
    text: `INSERT INTO ${schema.tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values,
  };

  await schema.hooks?.preCreate?.({ name: 'create', args: arguments });
  const result = await connection.query(query.text, query.values);
  const model = result.rows[0];
  await schema.hooks?.postCreate?.({ name: 'create', args: arguments, result: model });

  return model;
}

export async function update(schema, id, data) {
  const connection = getConnection();

  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClauses = fields.map((field, index) => `${field} = $${index + 1}`);
  values.push(id);

  const query = {
    text: `UPDATE ${schema.tableName} SET ${setClauses.join(', ')} WHERE id = $${fields.length + 1} RETURNING *`,
    values,
  };

  await schema.hooks?.preUpdate?.({ name: 'update', args: arguments });
  const result = await connection.query(query.text, query.values);
  const model = result.rows[0];
  await schema.hooks?.postUpdate?.({ name: 'update', args: arguments, result: model });

  return model;
}

export async function remove(schema, id) {
  const connection = getConnection();

  const query = {
    text: `DELETE FROM ${schema.tableName} WHERE id = $1 RETURNING *`,
    values: [id],
  };

  await schema.hooks?.preDelete?.({ name: 'delete', args: arguments });
  const result = await connection.query(query.text, query.values);
  const model = result.rows[0];
  await schema.hooks?.postDelete?.({ name: 'delete', args: arguments, result: model });

  return model;
}


async function validateData(schema, data) {
  const errors = [];

  const s
}
