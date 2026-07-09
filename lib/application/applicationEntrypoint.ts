import { ApplicationError } from '#constant';

export { ApplicationEntrypoint };

class ApplicationEntrypoint {
  #entrypoints: Map<string, Function>;

  constructor() {
    this.#entrypoints = new Map();
  }

  inject(key: string, runner: Function): void {
    if (this.#entrypoints.has(key)) throw new ApplicationError(`Entrypoint "${key}" is used`);
    this.#entrypoints.set(key, runner);
  }

  async run(key: string) {
    const runner = this.#entrypoints.get(key);
    if (!runner) throw new ApplicationError(`Entrypoint "${key}" is not found`);
    await runner();
  }

  async runAll() {
    for (const runner of this.#entrypoints.values()) await runner();
  }

  async runMaster() { }
}
