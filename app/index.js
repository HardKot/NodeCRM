import { Application } from '#core';
import { SpaceFastify } from '#http';
import { SpaceKnex } from '#database';

Application.base(({ plugin, server, database }) => {
  plugin(SpaceFastify, SpaceKnex);

  server(() => ({
    port: 3000,
    host: '127.0.0.1',
    routing: ({ get }) => {
      get('/', async ({ send }) => {
        send('Hello, world!');
      });
    },
  }));

  database(() => ({
    datasource: 'sqlite::memory',
    tables: ({ table }) => {
      const baseTable = {
        id: 'int',
        createdAt: 'datetime',
        updatedAt: 'datetime',
      };

      table({
        name: 'users',
        fields: {
          ...baseTable,
          name: 'string',
          age: 'int',
          email: 'string',
        },
      });

      table({
        name: 'posts',
        fields: {
          ...baseTable,
          title: 'string',
          content: 'string',
          user: '@User',
        },
      });
    },
  }));
});
