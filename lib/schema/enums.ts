import { EnumValue } from '../utils/types';
import type { ScalarValue } from './interface';

const ScalarType = Object.freeze({
  String: 0 as ScalarValue,
  Number: 1 as ScalarValue,
  Boolean: 2 as ScalarValue,
  Int: 3 as ScalarValue,
  Date: 4 as ScalarValue,
  UUID: 5 as ScalarValue,
  Text: 6 as ScalarValue,
});

export type IScalarType = EnumValue<typeof ScalarType, ScalarValue>;

export { ScalarType };
