import path from 'node:path';
import fs from 'node:fs';
import { Enveriment } from '#constant';
import { ObjectUtils } from '#utils';

const JsonConfig = 'app.config.json';
const ScriptConfig = ['app.config.ts', 'app.config.mjs', 'app.config.cjs', 'app.config.js'];

export { Config };

class Config implements IConfig {
  #value: Record<string, any>;

  readonly environment: IConfigEnvironmentValue;

  constructor({ }) {
    this.#value = {};
    const environmentKey = process.env.NODE_ENV ?? 'development';
    this.environment = Enveriment[environmentKey as IConfigEnvironmentKey] ?? Enveriment.DEVELOPMENT;
  }

  getValue<T>(pathname: string, defaultValue?: T): T {
    return this.#value[pathname] ?? defaultValue;
  }

  async loadConfig(): Promise<void> {
    const config = (await this.#loadJsonConfig()) ?? (await this.#loadScriptConfig());

    this.#value = ObjectUtils.flatten(config);

    Object.freeze(this.#value);
  }

  async #loadJsonConfig(): Promise<object | null> {
    const configPath = path.join(process.cwd(), this.#createFileName(JsonConfig));
    if (!fs.existsSync(configPath)) return null;
    return await import(configPath, { with: { type: 'json' } });
  }

  async #loadScriptConfig(): Promise<object | null> {
    const configPath = ScriptConfig.map((it) => this.#createFileName(it))
      .map((it) => path.join(process.cwd(), it))
      .filter((it) => fs.existsSync(it))
      .at(0);
    if (!configPath) return null;

    const { default: callback } = await import(configPath);
    return callback();
  }

  #createFileName(fileName: string) {
    return fileName.replace('app', this.environment);
  }
}
