import { BaseField } from './fields/baseField.js';
import { fieldParser } from './fieldParser.js';
import { ArrayField, EnumField, ScalarField, SchemaField } from './fields/index.js';

class Field extends BaseField {
  static parse(source) {
    return fieldParser.parse(source);
  }

  static Scalar = ScalarField;
  static Enum = EnumField;
  static Array = ArrayField;
  static Schema = SchemaField;
}

export { Field };
