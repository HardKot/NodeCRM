const { BaseField } = require('./fields/baseField.js');
const { fieldParser } = require('./fieldParser.js');
const { ArrayField, EnumField, ScalarField, SchemaField } = require('./fields');

class Field extends BaseField {
  static parse(source) {
    return fieldParser.parse(source);
  }

  static Scalar = ScalarField;
  static Enum = EnumField;
  static Array = ArrayField;
  static Schema = SchemaField;
}

module.exports = { Field };
