export function defaultModuleExtractor(module, names = []) {
    if (module?.default && module.default[Symbol.toStringTag] !== 'Module')
        return module.default;
    for (const name of names) {
        if (module[name])
            return module[name];
    }
    return module;
}
