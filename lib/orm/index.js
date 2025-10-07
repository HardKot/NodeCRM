import pg from 'pg';
import chalk from 'chalk';
import { SchemaLoader } from './schema-loader.js';

const { Pool } = pg;

// Типы полей для ORM
export const FieldTypes = {
  INTEGER: 'INTEGER',
  SERIAL: 'SERIAL',
  VARCHAR: (length = 255) => `VARCHAR(${length})`,
  TEXT: 'TEXT',
  BOOLEAN: 'BOOLEAN',
  TIMESTAMP: 'TIMESTAMP',
  DECIMAL: (precision = 10, scale = 2) => `DECIMAL(${precision},${scale})`,
  JSON: 'JSON',
  JSONB: 'JSONB',
};

// Класс для описания поля модели
export class Field {
  constructor(type, options = {}) {
    this.type = type;
    this.primaryKey = options.primaryKey || false;
    this.nullable = options.nullable !== false; // по умолчанию nullable
    this.unique = options.unique || false;
    this.default = options.default;
    this.references = options.references; // { table: 'table_name', field: 'field_name' }
    this.autoIncrement = options.autoIncrement || false;
    this.index = options.index || false;
  }

  // Генерация SQL для создания поля
  toSQL(fieldName) {
    let sql = `${fieldName} ${this.type}`;

    if (this.primaryKey) {
      sql += ' PRIMARY KEY';
    }

    if (!this.nullable) {
      sql += ' NOT NULL';
    }

    if (this.unique) {
      sql += ' UNIQUE';
    }

    if (this.default !== undefined) {
      if (typeof this.default === 'string') {
        sql += ` DEFAULT '${this.default}'`;
      } else {
        sql += ` DEFAULT ${this.default}`;
      }
    }

    if (this.references) {
      sql += ` REFERENCES ${this.references.table}(${this.references.field})`;
    }

    return sql;
  }
}

// Класс модели
export class Model {
  constructor(orm, tableName, fields) {
    this.orm = orm;
    this.tableName = tableName;
    this.fields = fields;
  }

  // Создание записи
  async create(data, transaction = null) {
    const client = transaction || this.orm.pool;

    const fieldNames = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${this.tableName} (${fieldNames.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await client.query(query, values);
    return result.rows[0];
  }

  // Поиск записей
  async find(conditions = {}, options = {}, transaction = null) {
    const client = transaction || this.orm.pool;

    let query = `SELECT * FROM ${this.tableName}`;
    const values = [];
    let valueIndex = 1;

    // WHERE условия
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.entries(conditions)
        .map(([field, value]) => {
          values.push(value);
          return `${field} = $${valueIndex++}`;
        })
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
    }

    // ORDER BY
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
      if (options.order) {
        query += ` ${options.order}`;
      }
    }

    // LIMIT и OFFSET
    if (options.limit) {
      query += ` LIMIT $${valueIndex++}`;
      values.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${valueIndex++}`;
      values.push(options.offset);
    }

    const result = await client.query(query, values);
    return result.rows;
  }

  // Поиск одной записи
  async findOne(conditions = {}, transaction = null) {
    const results = await this.find(conditions, { limit: 1 }, transaction);
    return results[0] || null;
  }

  // Поиск по ID
  async findById(id, transaction = null) {
    return this.findOne({ id }, transaction);
  }

  // Обновление записей
  async update(conditions, data, transaction = null) {
    const client = transaction || this.orm.pool;

    const updateFields = Object.entries(data).map(([field, value], index) => {
      return `${field} = $${index + 1}`;
    });

    let valueIndex = Object.keys(data).length + 1;
    const whereClause = Object.entries(conditions)
      .map(([field, value]) => {
        return `${field} = $${valueIndex++}`;
      })
      .join(' AND ');

    const query = `
      UPDATE ${this.tableName}
      SET ${updateFields.join(', ')}
      WHERE ${whereClause}
      RETURNING *
    `;

    const values = [...Object.values(data), ...Object.values(conditions)];
    const result = await client.query(query, values);
    return result.rows;
  }

  // Удаление записей
  async delete(conditions, transaction = null) {
    const client = transaction || this.orm.pool;

    let valueIndex = 1;
    const whereClause = Object.entries(conditions)
      .map(([field, value]) => {
        return `${field} = $${valueIndex++}`;
      })
      .join(' AND ');

    const query = `DELETE FROM ${this.tableName} WHERE ${whereClause} RETURNING *`;
    const values = Object.values(conditions);

    const result = await client.query(query, values);
    return result.rows;
  }

  // Подсчет записей
  async count(conditions = {}, transaction = null) {
    const client = transaction || this.orm.pool;

    let query = `SELECT COUNT(*) FROM ${this.tableName}`;
    const values = [];

    if (Object.keys(conditions).length > 0) {
      let valueIndex = 1;
      const whereClause = Object.entries(conditions)
        .map(([field, value]) => {
          values.push(value);
          return `${field} = $${valueIndex++}`;
        })
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
    }

    const result = await client.query(query, values);
    return parseInt(result.rows[0].count);
  }

  // Создание таблицы
  async createTable() {
    const fieldDefinitions = Object.entries(this.fields).map(([fieldName, field]) => {
      return field.toSQL(fieldName);
    });

    const query = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        ${fieldDefinitions.join(',\n        ')}
      )
    `;

    await this.orm.pool.query(query);

    // Создаем индексы
    for (const [fieldName, field] of Object.entries(this.fields)) {
      if (field.index && !field.primaryKey && !field.unique) {
        const indexQuery = `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_${fieldName} ON ${this.tableName}(${fieldName})`;
        await this.orm.pool.query(indexQuery);
      }
    }
  }
}

// Основной класс ORM
export class ORM {
  constructor(config) {
    this.pool = new Pool({
      user: config.user || process.env.DB_USER || 'postgres',
      host: config.host || process.env.DB_HOST || 'localhost',
      database: config.database || process.env.DB_NAME || 'nodecrm',
      password: config.password || process.env.DB_PASSWORD || 'postgres',
      port: config.port || process.env.DB_PORT || 5432,
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    this.models = {};
    this.connected = false;

    // Инициализируем загрузчик схем
    this.schemaLoader = new SchemaLoader(config.schemasPath);

    // Обработка событий пула
    this.pool.on('connect', () => {
      console.log(chalk.green('📊 Новое подключение к базе данных'));
    });

    this.pool.on('error', err => {
      console.error(chalk.red('❌ Ошибка пула соединений:'), err);
    });
  }

  // Подключение к базе данных с автоматической загрузкой схем
  async connect() {
    try {
      const client = await this.pool.connect();
      client.release();
      this.connected = true;
      console.log(chalk.green('✅ ORM подключена к базе данных'));

      // Автоматически загружаем схемы
      await this.loadSchemas();
    } catch (error) {
      console.error(chalk.red('❌ Ошибка подключения ORM к базе данных:'), error);
      throw error;
    }
  }

  // Загрузка схем из файлов
  async loadSchemas() {
    try {
      await this.schemaLoader.loadSchemas();
      await this.schemaLoader.applyToORM(this);

      console.log(chalk.green('🎯 Схемы успешно загружены и применены'));
      return this.models;
    } catch (error) {
      console.error(chalk.red('❌ Ошибка загрузки схем:'), error);
      throw error;
    }
  }

  // Определение модели (теперь опциональное, так как схемы загружаются автоматически)
  defineModel(tableName, fields) {
    const model = new Model(this, tableName, fields);
    this.models[tableName] = model;
    return model;
  }

  // Синхронизация всех моделей (создание таблиц и индексов)
  async sync() {
    if (!this.connected) {
      await this.connect();
    }

    console.log(chalk.yellow('🔄 Синхронизация моделей с базой данных...'));

    for (const [modelName, model] of Object.entries(this.models)) {
      try {
        await model.createTable();

        // Создаем индексы если модель имеет схему с индексами
        if (model.schema && typeof model.createIndexes === 'function') {
          await model.createIndexes();
        }

        console.log(chalk.green(`✅ Модель ${modelName} синхронизирована`));
      } catch (error) {
        console.error(chalk.red(`❌ Ошибка синхронизации модели ${modelName}:`), error);
      }
    }
  }

  // Получение модели по имени
  getModel(name) {
    return this.models[name];
  }

  // Информация о загруженных моделях
  getModelsInfo() {
    return this.schemaLoader.getSchemaInfo();
  }

  // Горячая перезагрузка схемы (для разработки)
  async reloadSchema(schemaName) {
    await this.schemaLoader.reloadSchema(schemaName);
    await this.schemaLoader.applyToORM(this);
  }

  // Начало транзакции
  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      console.log(chalk.cyan('🔄 Транзакция начата'));

      const result = await callback(client);

      await client.query('COMMIT');
      console.log(chalk.green('✅ Транзакция завершена успешно'));

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(chalk.red('❌ Транзакция отменена:'), error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Выполнение сырого SQL запроса
  async query(sql, values = []) {
    const result = await this.pool.query(sql, values);
    return result;
  }

  // Закрытие соединений
  async close() {
    await this.pool.end();
    console.log(chalk.yellow('📪 ORM соединения закрыты'));
  }
}

// Builder для удобного создания полей
export const field = {
  id: () => new Field(FieldTypes.SERIAL, { primaryKey: true, autoIncrement: true }),
  varchar: (length = 255, options = {}) => new Field(FieldTypes.VARCHAR(length), options),
  text: (options = {}) => new Field(FieldTypes.TEXT, options),
  integer: (options = {}) => new Field(FieldTypes.INTEGER, options),
  decimal: (precision = 10, scale = 2, options = {}) =>
    new Field(FieldTypes.DECIMAL(precision, scale), options),
  boolean: (options = {}) => new Field(FieldTypes.BOOLEAN, options),
  timestamp: (options = {}) =>
    new Field(FieldTypes.TIMESTAMP, { default: 'CURRENT_TIMESTAMP', ...options }),
  json: (options = {}) => new Field(FieldTypes.JSON, options),
  jsonb: (options = {}) => new Field(FieldTypes.JSONB, options),

  // Связи
  belongsTo: (table, field = 'id', options = {}) =>
    new Field(FieldTypes.INTEGER, {
      references: { table, field },
      ...options,
    }),
};
