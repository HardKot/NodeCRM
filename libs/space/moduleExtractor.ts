export type ModuleExtractor = (module: any, names?: string[]) => any;

export function defaultModuleExtractor(module: any, names: string[] = []) {
  if (module?.default && module.default[Symbol.toStringTag] !== 'Module') return module.default;

  for (const name of names) {
    if (module[name]) return module[name];
  }

  return module;
}
