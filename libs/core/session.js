import crypto from 'node:crypto';

class Session extends Map {
  constructor() {
    super();
    this.id = crypto.randomUUID();
  }
}

export { Session };
