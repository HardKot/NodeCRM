import path from 'node:path';
import fs from 'node:fs';

import { ObjectUtils, Types } from '#utils';

const JsonConfig = 'app.config.json';
const ScriptConfig = ['app.config.ts', 'app.config.mjs', 'app.config.cjs', 'app.config.js'];

export { Config };

interface ConfigProps {
  environment: IConfigEnvironmentValue;
}

class Config implements IConfig {
  #value: Record<string, any>;
  #configDir: string;
  defaultConfig: Partial<ApplicationConfig>;

  readonly environment: IConfigEnvironmentValue;

  constructor({ environment }: ConfigProps) {
    this.#value = {};
    this.defaultConfig = {};
    this.environment = environment;
    this.#configDir = path.join(process.cwd(), 'config');
    if (!fs.existsSync(this.#configDir)) {
      this.#configDir = process.cwd();
    }
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
    const configPath = path.join(this.#configDir, this.#createFileName(JsonConfig));
    if (!fs.existsSync(configPath)) return null;
    return await import(configPath, { with: { type: 'json' } });
  }

  async #loadScriptConfig(): Promise<object | null> {
    const configPath = ScriptConfig.map((it) => this.#createFileName(it))
      .map((it) => path.join(this.#configDir, it))
      .filter((it) => fs.existsSync(it))
      .at(0);
    if (!configPath) return null;

    const { default: config } = await import(configPath);
    if (Types.isObject(config)) return config;
    if (Types.isFunction(config)) {
      return config({ config: ObjectUtils.deepFreeze(this.defaultConfig) });
    }

    return null;
  }

  #createFileName(fileName: string) {
    return fileName.replace('app', this.environment);
  }
}
