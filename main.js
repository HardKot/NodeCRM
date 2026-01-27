const path = require('node:path');
const fs = require('node:fs');

const { Application } = require('./libs/core');
const { HttpServer } = require('./libs/httpServer');
const { VirtualSpace } = require('./libs/space/virtualSpace');

Application.build()
  .clusterCount(1)
  .module(
    VirtualSpace.factory({
      path: path.join(process.cwd(), 'src'),
    })
  )
  .stdout(process.stdout)
  .stderr(process.stderr)
  .plugins([
    HttpServer.factory({
      port: process.env.PORT || 3000,
      tls: {
        key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
        cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt')),
      },
    }),
  ])
  .run();
