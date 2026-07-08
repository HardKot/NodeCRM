import { Types } from '#utils';

export const Scoped = Types.enum<IScopeKey, IScopeValue>(['SINGLETON', 'TRANSIENT', 'SCOPED']);

export const ScalarType = Types.enum<IScalarKey, IScalarValue>([
  'STRING',
  'NUMBER',
  'BOOLEAN',
  'INT',
  'DATE',
  'UUID',
  'TEXT',
]);

export const LoggerLevel = Types.enum<ILogerLevelKey, ILogerLevelValue>(['DEBUG', 'LOG', 'INFO', 'WARN', 'ERROR']);

export const PackageGroups = Types.enum<IPackageGroupsKey, IPackageGroupsValue>(['NODE', 'NPM', 'LIB']);

export const Enveriment = Types.enum<IConfigEnvironmentKey, IConfigEnvironmentValue>({
  DEVELOPMENT: 'dev',
  STAGING: 'stag',
  PRODUCTION: 'app',
  TESTING: 'test',
});
