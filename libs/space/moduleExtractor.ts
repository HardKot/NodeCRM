export type ModuleExtractor = (module: any) => any;

export function defaultModuleExtractor(module: any) {
  if (module?.default) return module.default;
  const keys = Object.keys(module);
  for (const key of keys) {
    if (key.endsWith('Module')) return module[key];
    if (key.endsWith('.module')) return module[key];
  }
  return module;
}
