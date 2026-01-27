const { helloWorld } = require('./controllers/helloWorld.js');

class AppModule {
  constructor() {
    this.providers = [];
    this.consumers = [helloWorld];
  }
}

module.exports = { AppModule };
