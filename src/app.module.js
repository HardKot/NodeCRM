import { helloWorld } from './controllers/helloWorld.js';

class AppModule {
  constructor() {
    this.providers = [];
    this.consumers = [helloWorld];
  }
}

export { AppModule };
