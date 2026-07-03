import type { ScopeValue } from './interfaces.ts';

const Scoped = Object.freeze({
  SINGLETON: 0 as ScopeValue,
  TRANSIENT: 1 as ScopeValue,
  SCOPED: 2 as ScopeValue,
});

export { Scoped };
