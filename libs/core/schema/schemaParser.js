'use strict';

import { Types } from './types.js';

class SchemaParserError extends Error {}

class SchemaParser {
  #module;
  constructor(module) {
    this.#module = module;
  }

  parser(source) {
    const srcType = this.sourceType(source);
    const parserName = 'parser' + srcType.charAt(0).toUpperCase() + srcType.slice(1);
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
    let type = !required ? source.slice(0, -1) : source;
    const options = {};

    if (type.includes('|')) {
      return {
        Type: Types.ENUM,
        required,
        options: {
          enum: type.split('|').map(v => v.trim()),
        },
      };
    }

    if (type.startsWith('@')) {
      return {
        Type: Types.REFERENCES,
        required,
        options: {
          reference: type.slice(1),
        },
      };
    }

    if (Types[type.toUpperCase()]) {
      return {
        Type: Types[type.toUpperCase()],
        required,
        options,
      };
    }

    return {
      Type: Types.UNKNOWN,
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

    let { type, required = false, ...options } = source;

    if (Types[type.toUpperCase()]) {
      return {
        Type: Types[type.toUpperCase()],
        required,
        options,
      };
    }
    options.unknownType = type;

    return {
      Type: Types.UNKNOWN,
      required,
      options,
    };
  }

  parserSchema(source) {
    const fields = [];

    for (const field in source) {
      fields.push([field, this.parser(source[field])]);
    }

    return {
      Type: Types.SCHEMA,
      required: true,
      options: {
        schema: Object.fromEntries(fields),
      },
    };
  }

  parserArray(source) {
    const field = source[0];

    return {
      Type: Types.ARRAY,
      required: true,
      options: {
        value: this.parser(field),
      },
    };
  }
}

export { SchemaParser };
