import { Types } from './Types.js';

class Schema {
  constructor({
    type,
    require,
    options = {},
    validators = {},
    transformers = {},
    getReferenceSchema = () => {},
  }) {
    if (type === Types.REFERENCES) {
      return getReferenceSchema(options.reference);
    }

    if (type !== Types.SCHEMA) {
      this.validator = validators[type](require, options);
      this.transformer = transformers[type](require, options);
      return this;
    }

    for (const field in options.schema) {
      options[field] = new Schema({
        type: options[field].Type,
        require: options[field].required,
        options: options[field].options,
        validators,
        transformers,
        getReferenceSchema,
      });
    }
  }
}

export { Schema };
