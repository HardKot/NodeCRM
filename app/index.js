import { Application } from '#core';
import { SpaceFastify } from '#http';

Application.base(({ plugin, server }) => {
  plugin(SpaceFastify);

  server(({ port, host, routing }) => {
    port(3000);
    host('127.0.0.1');

    routing(({ get }) => {
      get('/', ({ send }) => {
        console.log('Hello, world!');
        send('Hello, world!');
      });
    });
  });
});
