export interface ModuleHook {
  onModulePreBuild?: () => Promise<void>;
  onModulePostBuild?: () => Promise<void>;
}

export type Namespace = string | symbol;

export type ComponentInjectType = string | symbol;

export type ComponentTypeValue = 'CONSUMER' | 'PROVIDER';

export type ScopedValue = 'SINGLETON' | 'TRANSIENT' | 'SCOPED';

export type EnumMap<T extends string> = Readonly<{
  [key in T]: number;
}>

export type MetadataKey = string | symbol;
export type MetadataEntriesRecord = Record<MetadataKey, any>;
export type MetadataEntriesIterable = Iterable<readonly [MetadataKey, any]>;
