'use strict';

const { Parser } = require('../../utils/index.js');
const { EnumField } = require('./fields/enumField.js');
const { ScalarField } = require('./fields/scalarField.js');
const { FieldError } = require('./fields/fieldError.js');
const { SchemaField } = require('./fields/schemaField.js');
const { ArrayField } = require('./fields/arrayField.js');

const cache = new WeakMap();

const fieldParser = new Parser({
  parseString(source) {
    const required = !source.endsWith('?');
    let type = !required ? source.slice(0, -1) : source;

    if (type.includes('|')) {
      return new Field.Enum(
        type.split('|').map(v => v.trim()),
        required
      );
    }

    type = type.toLocaleString();

    if (type in Field.Scalar.supportTypes) {
      return new Field.Scalar(type, required);
    }

    throw new FieldError(`Unsupported field type: ${type}`);
  },

  parseObject(source) {
    if (cache.has(source)) return cache.get(source);

    const [firstKey] = Object.keys(source);

    if (firstKey !== 'type') {
      return this.parseSchema(source);
    }

    const { required = false, ...options } = source;
    const type = source.type.toLowerCase();

    if (Field.Scalar.supportTypes in type) {
      return new Field.Scalar(type, required);
    }

    throw new FieldError(`Unsupported field type: ${type}`);
  },

  parseSchema(source) {
    if (cache.has(source)) return cache.get(source);

    const fieldsEntries = [];
    const [firstKey] = Object.keys(source);
    let proto = null;

    if (firstKey === 'Prototype') proto = source['Prototype'];
    if (firstKey === 'Constructor') proto = source['Constructor'].prototype;

    delete source['Prototype'];
    delete source['Constructor'];
    source = JSON.parse(JSON.stringify(source));

    for (const field in source) fieldsEntries.push([field, this.parse(source[field])]);

    return new Field.Schema(Object.fromEntries(fieldsEntries), proto);
  },

  parseArray(source) {
    const field = source[0];

    return new Field.Array(this.parse(field), true);
  },
});

module.exports = { fieldParser };
