export class Storage {
  constructor(app) {
    this.app = app;
  }

  async session(sessionID) {}
  async user(userID) {}

  async load() {}
}
