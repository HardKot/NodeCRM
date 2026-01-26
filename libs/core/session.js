const crypto = require('node:crypto');

class Session extends Map {
  constructor() {
    super();
    this.id = crypto.randomUUID();
  }
}

module.exports = { Session };
