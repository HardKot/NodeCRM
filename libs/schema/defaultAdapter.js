import { ArrayField, EnumField, ScalarField, SchemaField, UnknownField } from './field.js';
import { FieldType } from './fieldType.js';

const recordType = {
  [FieldType.NUMBER]: 'number',
  [FieldType.STRING]: 'string',
  [FieldType.BOOLEAN]: 'boolean',
};

class DefaultAdapter {
  factoryType(field) {
    const { Type, required, options } = field;

    switch (Type) {
      case FieldType.NUMBER:
      case FieldType.STRING:
      case FieldType.BOOLEAN:
        return new ScalarField(recordType[Type], required);

      case FieldType.ENUM: {
        const { enum: _enum } = options;
        return new EnumField(_enum, required);
      }
      case FieldType.ARRAY: {
        const { value } = options;
        return new ArrayField(this.factoryType(value), required);
      }
      case FieldType.SCHEMA: {
        const { schema, proto } = options;
        const params = {};

        for (const key in schema) {
          params[key] = this.factoryType(schema[key]);
        }

        return new SchemaField(params, proto);
      }
      default:
        return new UnknownField();
    }
  }
}

export { DefaultAdapter };
