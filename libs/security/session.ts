import * as crypto from 'node:crypto';

export class Session extends Map<string, any> {
  #hasChange = false;
  public readonly id: string;

  constructor(payload: Record<string, any> = {}, id?: string) {
    super(Object.entries(payload));
    if (id) {
      this.id = id;
    } else {
      this.id = crypto.randomUUID();
    }
  }

  set(key: string, value: any): this {
    super.set(key, value);
    this.#hasChange = true;
    return this;
  }

  get hasChange(): boolean {
    return this.#hasChange;
  }

  get roles(): string[] {
    return this.get('roles') ?? [];
  }

  get permissions(): string[] {
    return this.get('permissions') ?? [];
  }
}
