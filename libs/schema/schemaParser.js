'use strict';

import { FieldType } from './fieldType.js';
import { StringCase } from '#lib/utils';

class SchemaParserError extends Error {}

class SchemaParser {
  parser(source) {
    const srcType = this.sourceType(source);
    const parserName = StringCase.factoryCamelCase('parser', srcType);
    const parser = this[parserName];

    if (!parser) throw new SchemaParserError('No parser found for source type: ' + srcType);

    return parser?.call(this, source);
  }

  sourceType(source) {
    if (Array.isArray(source)) return 'array';
    return typeof source;
  }

  parserString(source) {
    const required = !source.endsWith('?');
    const type = !required ? source.slice(0, -1) : source;
    const options = {};

    if (type.includes('|')) {
      return {
        Type: FieldType.ENUM,
        required,
        options: {
          enum: type.split('|').map(v => v.trim()),
        },
      };
    }

    if (FieldType[type.toUpperCase()]) {
      return {
        Type: FieldType[type.toUpperCase()],
        required,
        options,
      };
    }

    return {
      Type: FieldType.UNKNOWN,
      required,
      options: {
        unknownType: type,
      },
    };
  }

  parserObject(source) {
    const [firstKey] = Object.keys(source);

    if (firstKey !== 'type') {
      return this.parserSchema(source);
    }

    const { type, required = false, ...options } = source;

    if (FieldType[type.toUpperCase()]) {
      return {
        Type: FieldType[type.toUpperCase()],
        required,
        options,
      };
    }
    options.unknownType = type;

    return {
      Type: FieldType.UNKNOWN,
      required,
      options,
    };
  }

  parserSchema(source) {
    const fields = [];
    let prototype = Object.prototype;
    const [firstKey] = Object.keys(source);
    if (firstKey === 'Prototype') prototype = source['Prototype'];
    if (firstKey === 'Constructor') prototype = source['Constructor'].prototype;

    for (const field in source) {
      if (['Prototype', 'Constructor'].includes(field)) continue;
      fields.push([field, this.parser(source[field])]);
    }

    return {
      Type: FieldType.SCHEMA,
      required: true,
      options: {
        schema: Object.fromEntries(fields),
        proto: prototype,
      },
    };
  }

  parserArray(source) {
    const field = source[0];

    return {
      Type: FieldType.ARRAY,
      required: true,
      options: {
        value: this.parser(field),
      },
    };
  }
}

export { SchemaParser };
