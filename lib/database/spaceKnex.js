import { CoreError, SpaceModule, Schema, Bean, Scoped } from '#core';
import { ObjectUtils, StringUtils, Types } from '#utils';

import knex from 'knex';

export { SpaceKnex };

const Database = 'Database';
const Repository = 'repository';

class SpaceKnex extends SpaceModule {
  #current = [null];
  constructor(app) {
    super(app);

    this.prefix = Database;
    this.logger = this.app.logger.extend(`${this.app.prefix}[${this.prefix}]`);

    this.app.injectDescription(Database, this.descriptionDatabase.bind(this));
    this.config = {
      datasource: 'sqlite::memory',
    };
    this.tables = {};

    Object.freeze(this);
  }

  async prepare() {
    this.#initKenx();

    for (const table of this.tables) {
      const repository = this.#generateRepository(table);

      const bean = new Bean({
        name: StringUtils.factoryPascalCase(table.name, Repository),
        scope: Scoped.SINGLETON,
        aliases: [StringUtils.factoryPascalCase(table.name, Repository)],
        factory: () => repository,
      });

      this.app.beanRegistry.add(bean);
    }
  }

  descriptionDatabase(callback) {
    const database = callback();

    this.config.datasource = database.datasource ?? this.config.datasource;

    database.tables?.({
      table: this.linkTable.bind(this),
    });
  }

  #generateRepository(table) {
    const repository = {};
  }

  #factorySelectFn({ tableName, schema }) {
    const selectObject = this.#generateSelect({ schema });

    return () => {
      this.#knex.select(selectObject);
    };
  }

  // #generateRepository({ schema, tableName }) {
  //   if (Types.isNotInstanceOf(schema, Schema)) throw new CoreError('schema is not Schema');
  //   const cmds = this.#parserSchema({ schema });
  //   const createBuilder = () => {
  //     const builder = this.#knex.table(tableName);
  //
  //   }
  //
  //   const repository = {
  //
  //   };
  //   Object.freeze(repository)
  //
  //   return repository;
  // }

  #parserSchema({ schema }) {
    const builder = knex();

    const addSelect = (jsKey, sqlField) => builder.push(['select', { [jsKey]: sqlField }]);
    const addGetOne = (jsKey, schemaName) => builder.push(['getOne', { [jsKey]: schemaName }]);

    for (const key in schema) {
      const fieldName = StringUtils.factorySnakeCase(key);

      if (Types.isAnyInstanceOf(value, Schema.Scalar, Schema.Enum)) addSelect(key, fieldName);
      if (Types.isInstanceOf(value, Schema.Reference)) addGetOne(key, value.name);

      if (Types.isInstanceOf(value, Schema.Object)) {
        const embeded = this.#parserSchema({ schema: value });
        const select = this.#buildSelectObj(embeded);
        const getOne = this.#buildGetOneObj(embeded);

        for (const embededKey in select)
          addSelect(`${key}.${embededKey}`, StringUtils.factorySnakeCase(fieldName, select[embededKey]));

        for (const embededKey in getOne) {
          addGetOne(`${key}.${embededKey}`, getOne[embededKey]);
        }
      }

      if (Types.isInstanceOf(value, Schema.Array)) {
        // TODO: Надо придумать как обрабатывать массивы, так как они могут быть массивом скаляров, объектов или ссылок
      }
    }

    return builder;
  }

  #buildSelectObj(builderCmd) {
    return builderCmd
      .filter(([field]) => field === 'select')
      .map(([, args]) => args)
      .reduce((acc, cur) => ({ ...acc, ...cur }), {});
  }

  #buildGetOneObj(builderCmd) {
    return builderCmd
      .filter(([field]) => field === 'getOne')
      .map(([, args]) => args)
      .reduce((acc, cur) => ({ ...acc, ...cur }), {});
  }

  get #knex() {
    if (this.#current[0]) return this.#current[0];
    throw new CoreError('Knex is not initialized');
  }

  #initKenx() {
    this.#current[0] = knex({
      ...this.#datasourceParser(),
      log: this.logger,
    });
  }

  #datasourceParser() {
    const { datasource } = this.config;
    if (!datasource) throw new CoreError('Datasource is not define');
    let { client, connection } = datasource;

    if (Types.isString(datasource)) [client, connection] = datasource.split(':');

    client = this.#defineClient(client);
    if (Types.isString(connection)) connection = this.#parserConnection(client, connection);

    return {
      client,
      connection,
    };
  }

  #defineClient(client) {
    if (['sqlite', 'sqlite3'].includes(client)) return DatabaseConnection.SQLITE;
    return null;
  }

  #parserConnection(client, conn) {
    if (client === DatabaseConnection.SQLITE) {
      const [filename, ...flags] = conn.split(' --');
      return {
        filename,
        flags,
      };
    }
  }
}
