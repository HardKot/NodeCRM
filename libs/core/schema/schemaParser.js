const Type = {
  references: 0,
  array: 1,
  schema: 2,

  number: 3,
  string: 4,
  boolean: 5,
};

class SchemaParserError extends Error {}

class SchemaParser {
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
    const required = source.endsWith('!');
    let type = required ? source.slice(0, -1) : source;
    let meta = null;

    if (type.startsWith('@')) {
      type = 'references';
      meta['reference'] = type.slice(1);
    }

    return this.parserObject({ type, required, meta });
  }

  parserObject(source) {
    const { type, required = false, meta = null } = source;

    if (!type) {
      return this.parserSchema(source);
    }

    if (!Type[type]) {
      return null;
    }

    return {
      Type: Type[type],
      required,
      field: meta,
    };
  }

  parserPrimitive(source) {
    const { type } = source;

    if (!!Type[type]) {
      const meta = source[type];

      return {
        type: Type[type],
        required: source.required || false,
        meta: meta,
      };
    }

    return null;
  }

  parserSchema(source) {
    return {
      Type: Type.schema,
      required: source.required ?? false,
      field: source,
    };
  }

  parserArray(source) {
    const field = source[0];

    return {
      Type: Type.array,
      field: this.parser(field),
    };
  }
}

export { SchemaParser, Type };
