export function Component(key) {
  return function(target) {
    if (!target.__crmMeta) target.__crmMeta = {};
    target.__crmMeta.diContainer = {};
    target.__crmMeta.diContainer.name = key || target.name;
  };
}

export function Inject(key) {
  return function(target, propertyKey, parametrIndex) {
    if (propertyKey !== 'constructor') return;

    if (!target.__crmMeta.diContainer) target.__crmMeta.diContainer = {};
    if (!target.__crmMeta.diContainer.deps) target.__crmMeta.diContainer.deps = [];

    target.__crmMeta.diContainer.deps[parametrIndex] = key;
  };
}

export function Configuration() {
  return function(target) {
    if (!target.__crmMeta) target.__crmMeta = {};
    target.__crmMeta.configuration = {};
  };
}

export function Bean(key) {
  return function(target, propertyKey, descriptor) {
    if (!target.__crmMeta) target.__crmMeta = {};
    target.__crmMeta.configuration[key] = descriptor;
  };
}

export function Scope(type) {
  return function(target) {
    if (!target.__crmMeta) target.__crmMeta = {};
    if (target.__crmMeta.diContainer) target.__crmMeta.diContainer.scope = type;
  };
}

export function PostConstructor() {
  return function(target, propertyKey, descriptor) {
    if (!target.__crmMeta) target.__crmMeta = {};
    if (target.__crmMeta.diContainer) target.__crmMeta.diContainer.postConstructor = propertyKey;
  };
}
