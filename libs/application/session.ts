import * as crypto from 'node:crypto';

export class Session extends Map {
  private id: string;

  constructor() {
    super();
    this.id = crypto.randomUUID();
  }

  get roles(): string[] {
    return this.get('roles') ?? [];
  }

  get permissions(): string[] {
    return this.get('permissions') ?? [];
  }
}
