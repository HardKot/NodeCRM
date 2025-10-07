import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Класс для загрузки и управления схемами ORM
export class SchemaLoader {
  constructor(schemasPath = null) {
    this.schemasPath = schemasPath || join(__dirname, '..', 'schemas');
    this.schemas = new Map();
    this.loadedSchemas = new Map();
  }

  // Автоматическая загрузка всех схем из директории
  async loadSchemas() {
    try {
      console.log(chalk.yellow(`📁 Загружаем схемы из: ${this.schemasPath}`));

      const files = await readdir(this.schemasPath);
      const schemaFiles = files.filter(file => file.endsWith('.js'));

      for (const file of schemaFiles) {
        await this.loadSchema(file);
      }

      console.log(chalk.green(`✅ Загружено ${this.schemas.size} схем`));
      return this.schemas;
    } catch (error) {
      console.error(chalk.red('❌ Ошибка загрузки схем:'), error);
      throw error;
    }
  }

  // Загрузка отдельной схемы
  async loadSchema(filename) {
    try {
      const schemaPath = join(this.schemasPath, filename);
      const schemaModule = await import(`file://${schemaPath}?t=${Date.now()}`);

      // Ищем экспортированные схемы в модуле
      const schemaName = filename.replace('.js', '');
      const possibleExports = [
        `${schemaName}Schema`,
        `${schemaName.charAt(0).toUpperCase() + schemaName.slice(1)}Schema`,
        'default',
      ];

      let schema = null;
      for (const exportName of possibleExports) {
        if (schemaModule[exportName]) {
          schema = schemaModule[exportName];
          break;
        }
      }

      if (!schema) {
        console.warn(chalk.yellow(`⚠️  Схема не найдена в файле ${filename}`));
        return null;
      }

      // Валидируем схему
      this.validateSchema(schema, schemaName);

      // Сохраняем схему
      this.schemas.set(schemaName, schema);
      console.log(chalk.green(`✅ Схема ${schemaName} загружена`));

      return schema;
    } catch (error) {
      console.error(chalk.red(`❌ Ошибка загрузки схемы ${filename}:`), error);
      throw error;
    }
  }

  // Валидация схемы
  validateSchema(schema, name) {
    if (!schema.tableName) {
      throw new Error(`Схема ${name} должна содержать tableName`);
    }

    if (!schema.fields || typeof schema.fields !== 'object') {
      throw new Error(`Схема ${name} должна содержать объект fields`);
    }

    if (!schema.fields.id) {
      throw new Error(`Схема ${name} должна содержать поле id`);
    }

    // Проверяем, что все поля являются экземплярами Field
    for (const [fieldName, field] of Object.entries(schema.fields)) {
      if (!field || typeof field.toSQL !== 'function') {
        throw new Error(
          `Поле ${fieldName} в схеме ${name} должно быть создано через field builder`
        );
      }
    }
  }

  // Получение схемы по имени
  getSchema(name) {
    return this.schemas.get(name);
  }

  // Получение всех схем
  getAllSchemas() {
    return Array.from(this.schemas.values());
  }

  // Применение схем к ORM
  async applyToORM(orm) {
    console.log(chalk.yellow('🔄 Применяем схемы к ORM...'));

    for (const [name, schema] of this.schemas) {
      try {
        // Создаем модель с расширенной функциональностью
        const model = this.createEnhancedModel(orm, schema);
        orm.models[name] = model;

        console.log(chalk.green(`✅ Модель ${name} создана`));
      } catch (error) {
        console.error(chalk.red(`❌ Ошибка создания модели ${name}:`), error);
        throw error;
      }
    }

    return orm.models;
  }

  // Создание расширенной модели с хуками и валидацией
  createEnhancedModel(orm, schema) {
    // Создаем базовую модель
    const baseModel = orm.defineModel(schema.tableName, schema.fields);

    // Расширяем модель дополнительной функциональностью
    class EnhancedModel extends baseModel.constructor {
      // Переопределяем create с хуками и валидацией
      async create(data, transaction = null) {
        try {
          // Валидация
          if (schema.validations) {
            await this.validateData(data, schema.validations);
          }

          // Хук beforeCreate
          if (schema.hooks?.beforeCreate) {
            data = await schema.hooks.beforeCreate(data);
          }

          // Создание записи
          const result = await super.create(data, transaction);

          // Хук afterCreate
          if (schema.hooks?.afterCreate) {
            await schema.hooks.afterCreate(result, data);
          }

          return result;
        } catch (error) {
          console.error(chalk.red(`Ошибка создания записи в ${schema.tableName}:`), error);
          throw error;
        }
      }

      // Переопределяем update с хуками и валидацией
      async update(conditions, data, transaction = null) {
        try {
          // Получаем текущие данные для хуков
          const currentRecord = await super.findOne(conditions, transaction);

          // Валидация
          if (schema.validations) {
            await this.validateData(data, schema.validations, currentRecord);
          }

          // Хук beforeUpdate
          if (schema.hooks?.beforeUpdate) {
            data = await schema.hooks.beforeUpdate(data, currentRecord);
          }

          // Обновление записи
          const result = await super.update(conditions, data, transaction);

          // Хук afterUpdate
          if (schema.hooks?.afterUpdate) {
            await schema.hooks.afterUpdate(result, data, currentRecord);
          }

          return result;
        } catch (error) {
          console.error(chalk.red(`Ошибка обновления записи в ${schema.tableName}:`), error);
          throw error;
        }
      }

      // Валидация данных
      async validateData(data, validations, currentRecord = null) {
        for (const [field, validator] of Object.entries(validations)) {
          if (data.hasOwnProperty(field)) {
            try {
              if (typeof validator === 'function') {
                await validator(data[field], data, currentRecord);
              }
            } catch (error) {
              throw new Error(`Ошибка валидации поля ${field}: ${error.message}`);
            }
          }
        }
      }

      // Создание индексов
      async createIndexes() {
        if (schema.indexes) {
          for (const index of schema.indexes) {
            try {
              const indexName = `idx_${schema.tableName}_${index.fields.join('_')}`;
              const uniqueClause = index.unique ? 'UNIQUE ' : '';
              const fieldsClause = index.fields.join(', ');

              const query = `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${indexName} ON ${schema.tableName}(${fieldsClause})`;
              await this.orm.pool.query(query);

              console.log(chalk.green(`✅ Индекс ${indexName} создан`));
            } catch (error) {
              console.warn(chalk.yellow(`⚠️  Ошибка создания индекса:`, error.message));
            }
          }
        }
      }
    }

    // Создаем экземпляр расширенной модели
    const enhancedModel = new EnhancedModel(orm, schema.tableName, schema.fields);

    // Добавляем ссылку на схему
    enhancedModel.schema = schema;

    return enhancedModel;
  }

  // Горячая перезагрузка схем (для разработки)
  async reloadSchema(schemaName) {
    console.log(chalk.yellow(`🔄 Перезагружаем схему ${schemaName}...`));

    const filename = `${schemaName}.js`;
    await this.loadSchema(filename);

    console.log(chalk.green(`✅ Схема ${schemaName} перезагружена`));
  }

  // Информация о загруженных схемах
  getSchemaInfo() {
    const info = {};

    for (const [name, schema] of this.schemas) {
      info[name] = {
        tableName: schema.tableName,
        fieldsCount: Object.keys(schema.fields).length,
        hasHooks: !!(schema.hooks && Object.keys(schema.hooks).length > 0),
        hasValidations: !!(schema.validations && Object.keys(schema.validations).length > 0),
        hasIndexes: !!(schema.indexes && schema.indexes.length > 0),
      };
    }

    return info;
  }
}
