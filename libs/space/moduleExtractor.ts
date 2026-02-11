import * as path from 'node:path';
import { StringUtils } from '../utils';

export type ModuleExtractor = (module: any, name?: string) => any;

export function defaultModuleExtractor(module: any, name?: string) {
  if (module?.default) return module.default;

  if (name) {
    const parsed = path.parse(name);
    name = StringUtils.factoryPascalCase.apply(StringUtils, parsed.name.split('.'));
  }

  if (name) {
    return module[name];
  }

  return module;
}
