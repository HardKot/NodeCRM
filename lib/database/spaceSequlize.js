import { CoreError, SpaceModule, Schema, ScalarType } from '#core';
import { StringUtils, Types } from '#utils';

import { Sequelize, DataTypes } from 'sequelize';
import { HooksManager } from '../core/hooksManager.js';

export { SpaceSequelize };

const ScalarMap = {
  [ScalarType.Boolean]: DataTypes.BOOLEAN,
  [ScalarType.Int]: DataTypes.INTEGER,
  [ScalarType.Number]: DataTypes.FLOAT,
  [ScalarType.String]: DataTypes.STRING,
  [ScalarType.Date]: DataTypes.DATE,
  [ScalarType.Text]: DataTypes.TEXT,
  [ScalarType.UUID]: DataTypes.UUID,
};

class SpaceSequelize extends SpaceModule {
  constructor(app) {
    super(app);

    this.prefix = 'ORM';
    this.hooks = new HooksManager();
    this.logger = this.app.logger.extend(`${this.app.prefix}[${this.prefix}]`);

    this.app.injectDescription('database', this.descriptionDatabase.bind(this));
    this.config = {
      datasource: 'sqlite::memory',
    };
    this.tables = {};
    this.current = [];

    this.hooks.createHooks(DatabaseHooks.postPrepare);
    this.prepare = this.hooks.wrap({
      fn: this.prepare.bind(this),
      post: DatabaseHooks.postPrepare,
    });

    Object.freeze(this);
  }

  get sequelize() {
    if (this.current.length === 0) throw new CoreError('Database is not initialized');
    return this.current[0];
  }

  descriptionDatabase(callback) {
    const database = callback();

    this.config.datasource = database.datasource ?? this.config.datasource;

    database.tables?.({
      table: this.linkTable.bind(this),
    });
  }

  linkTable({ name, fields, softDeleted = false }) {
    name = StringUtils.factoryCamelCase(name);
    if (!Types.isString(name)) throw new CoreError('Table name must be a string');
    if (Types.isString(fields)) {
      fields = this.app.schemas.get(fields);
    } else if (Types.isObject(fields)) {
      fields = this.app.schemas.parser(fields);
    } else {
      throw new CoreError('Table fields must be an object or schema name');
    }

    if (this.models.has(name)) throw new CoreError(`Model with name ${name} already exists`);

    this.tables[name] = { name, fields, options: { softDeleted } };
  }

  transformTableFields({ tableName, fields, name }) {
    if (Types.isNotInstanceOf(fields, Schema)) throw new CoreError('Table fields must be a schema');
    const sequelizeFields = {};
    const postDefine = [];

    for (const [key, schema] of fields) {
      const [field, callback] = this.factorySequelizeField({
        schema,
        key,
        tableName,
        name,
      });

      if (field) sequelizeFields[key] = field;
      if (callback) postDefine.pus(callback);
    }

    return { sequelizeFields, postDefine };
  }

  factorySequelizeField({ schema, key, tableName, name }) {
    if (Types.isInstanceOf(schema, Schema.Scalar)) {
      return {
        type: ScalarMap[schema.scalar],
        allowNull: schema.required,
      };
    }

    if (Types.isInstanceOf(schema, Schema.Enum)) {
      return {
        type: DataTypes.ENUM,
        values: schema.values,
      };
    }

    if (Types.isInstanceOf(schema, Schema)) {
      const model = this.defineTable({
        tableName: StringUtils.factorySnakeCase(key, tableName),
        name: StringUtils.factoryPascalCase(key, name),
        fields: schema,
        options: {},
      });

      this.hooks.on(DatabaseHooks.postPrepare, () => {
        const it = this.models[name];
        it.belongsTo(model, {});
        model.hasOne(it, {
          onDelete: 'CASCADE',
        });
      });
      return null;
    }
    if (Types.isInstanceOf(schema, Schema.Array)) {
      const model = this.defineTable({
        tableName: StringUtils.factorySnakeCase(key, tableName),
        name: StringUtils.factoryPascalCase(key, modelName),
        fields: this.factorySequelizeField({ schema: value, key, tableName, name: modelName }),
        options: {},
      });

      this.hooks.on(DatabaseHooks.postPrepare, () => {
        const it = this.models[name];
        it.belongsTo(model, {});
        model.hasOne(it, {
          onDelete: 'CASCADE',
        });
      });

      return null;
    }

    if (Types.isInstanceOf(schema, Schema.Reference)) {
      // TODO: Реализаций
      return null;
    }
  }

  async prepare() {
    this.current.push(new Sequelize(this.config.datasource));

    for (const tableName in this.tables) {
      const { name, fields, options } = this.models[tableName];
      this.defineTable({
        tableName,
        name,
        fields,
        options,
      });
    }
  }

  defineTable({ tableName, name, fields, options }) {
    const sequelizeFields = {};

    for (const key in fields) {
      sequelizeFields[key] = this.factorySequelizeField({
        schema: fields[key],
        name,
        tableName,
        key,
      });
    }

    this.models[name] = this.sequelize.define(name, sequelizeFields, {
      paranoid: options.softDeleted,
      tableName: tableName,
    });

    return this.models[name];
  }
}
