import { EnumValue } from '../utils/types';
import type { ScopeValue } from './interfaces';

const Scoped = Object.freeze({
  SINGLETON: 0 as ScopeValue,
  TRANSIENT: 1 as ScopeValue,
  SCOPED: 2 as ScopeValue,
});

export type IScoped = EnumValue<typeof Scoped, ScopeValue>;

export { Scoped };
