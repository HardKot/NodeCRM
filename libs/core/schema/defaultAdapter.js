import { ArrayField, EnumField, ScalarField, SchemaField, UnknownField } from './field.js';
import { Types } from './types.js';

const recordType = {
  [Types.NUMBER]: 'number',
  [Types.STRING]: 'string',
  [Types.BOOLEAN]: 'boolean',
};

class DefaultAdapter {
  #module;

  constructor(module) {
    this.#module = module;
  }

  factoryType(field) {
    const { Type, required, options } = field;

    switch (Type) {
      case Types.NUMBER:
      case Types.STRING:
      case Types.BOOLEAN:
        return new ScalarField(recordType[Type], required);

      case Types.ENUM:
        const { enum: _enum } = options;
        return new EnumField(_enum, required);

      case Types.ARRAY:
        const { value } = options;
        return new ArrayField(this.factoryType(value), required);

      case Types.SCHEMA:
        const { schema } = options;
        const params = {};

        for (const key in schema) {
          params[key] = this.factoryType(schema[key]);
        }

        return new SchemaField(params);

      case Types.REFERENCES:
        const { references } = options;
        const type = this.#module.registry.get(references);
        return this.factoryType(type);

      default:
        return new UnknownField();
    }
  }
}

export { DefaultAdapter };
