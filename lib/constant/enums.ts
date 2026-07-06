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
