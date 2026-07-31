import { ScalarType, SourceParserError } from '#constant';
import { FunctionUtils, ObjectUtils, StringUtils, Types } from '#utils';

import { ArraySchema } from './arraySchema.ts';
import { BaseSchema } from './baseSchema.ts';
import { EnumSchema } from './enumSchema.ts';
import { ReferenceSchema } from './referenceSchema.ts';
import { ScalarSchema } from './scalarSchema.ts';
import { Schema } from './schema.ts';

interface ISource {
  Type: string;
  Required?: boolean;
  Options: unknown[];
}

interface SchemaObject {
  Prototype?: object;
  Constructor?: new (...arg: any[]) => unknown;
}

const createtorSchema: Record<string, (require: boolean, ...options: unknown[]) => BaseSchema> = {
  string: (required: boolean) => new ScalarSchema({ scalar: ScalarType.STRING, required }),
  number: (required: boolean) => new ScalarSchema({ scalar: ScalarType.NUMBER, required }),
  boolean: (required: boolean) => new ScalarSchema({ scalar: ScalarType.BOOLEAN, required }),
  int: (required: boolean) => new ScalarSchema({ scalar: ScalarType.INT, required }),
  date: (required: boolean) => new ScalarSchema({ scalar: ScalarType.DATE, required }),
  uuid: (required: boolean) => new ScalarSchema({ scalar: ScalarType.UUID, required }),
  text: (required: boolean) => new ScalarSchema({ scalar: ScalarType.TEXT, required }),
  enum: (required: boolean, values: unknown) => {
    if (!Types.isArray(values, Types.isString))
      throw new SourceParserError(`Expected string array, but get ${typeof values}`);
    return new EnumSchema({ values, required });
  },
  array: (required: boolean, item: unknown) => {
    if (Types.isNotInstanceOf(item, BaseSchema)) throw new SourceParserError(`Expected schema, but get ${typeof item}`);
    return new ArraySchema({ item, required });
  },
  object: (required: boolean, schema: unknown, proto: unknown) => {
    if (!Types.isRecord(schema, (it) => Types.isInstanceOf(it, BaseSchema)))
      throw new SourceParserError(`Expected schema, but get ${typeof schema}`);
    if (Types.isNull(proto) || Types.isObject(proto))
      throw new SourceParserError(`Expected object or null for proto, but get ${typeof schema}`);

    return new Schema({ schema, proto, required });
  },
};

const StringToScalarType: Record<string, IScalarValue> = {
  string: ScalarType.STRING,
  number: ScalarType.NUMBER,
  boolean: ScalarType.BOOLEAN,
  int: ScalarType.INT,
  date: ScalarType.DATE,
  uuid: ScalarType.UUID,
  text: ScalarType.TEXT,
};

export class SchemaManager implements ISchemaManager<BaseSchema> {
  #store: Map<string, any>;

  constructor() {
    this.#store = new Map();

    const caches = new Map<any, BaseSchema>();

    this.parse = FunctionUtils.memo<unknown, BaseSchema>(this.parse, caches).bind(this);
    this.parseString = FunctionUtils.memo<string, BaseSchema>(this.parseString, caches).bind(this);
    this.parseObject = FunctionUtils.memo(this.parseObject, caches).bind(this);
    this.parseArray = FunctionUtils.memo(this.parseArray, caches).bind(this);
    this.parseClass = FunctionUtils.memo(this.parseClass, caches).bind(this);
  }

  get<T extends BaseSchema>(name: string): T | null {
    const it = this.#store.get(name);
    return it ?? null;
  }

  add(alias: string, schema: BaseSchema): void {
    if (this.#store.has(alias)) throw new SourceParserError(`Alias: "${alias}" is exists`);
    this.#store.set(alias, schema);
  }

  create(alias: string, value: unknown): BaseSchema {
    if (this.#store.has(alias)) throw new SourceParserError(`Alias: "${alias}" is exists`);
    const schema = this.parse(value);
    this.#store.set(alias, schema);
    return schema;
  }

  parse(value: unknown): BaseSchema {
    const srcType = this.#getSourceType(value);
    const methodName = StringUtils.factoryCamelCase(`parse`, srcType) as keyof SchemaManager | string;
    if (!Types.isIn(methodName, this)) throw new SourceParserError(`Parser for source type "${srcType}" not specified`);
    const parser = this[methodName];
    if (!Types.isFunction(parser)) throw new SourceParserError(`Parser for source type "${srcType}" not specified`);
    return parser.call(this, value);
  }

  parseString(source: string): BaseSchema {
    const required = !source.endsWith('?');
    if (required) source = source.slice(0, -1);
    if (source.startsWith('@')) {
      const name = source.slice(1);
      return new ReferenceSchema({
        name,
        load: this.#createLoader(name),
        required,
      });
    }
    if (source.includes('|')) {
      const values = source.split('|');
      return new EnumSchema({ values, required });
    }

    const scalar = StringToScalarType[source];
    if (!scalar) throw new SourceParserError(`Don't supported scalarType ${source}`);

    return new ScalarSchema({
      scalar,
      required,
    });
  }

  parseObject(source: ISource | SchemaObject): BaseSchema {
    if (!this.#isISource(source)) return this.#parseSourceSchema(source);
    return this.#createSchema(source);
  }

  parseArray(source: Array<any>): BaseSchema {
    if (source.length === 0) throw new SourceParserError(`Empty erray is not supported`);
    if (source.length === 1) return new ArraySchema({ item: this.parse(source[0]), required: true });
    if (Types.isArray(source, Types.isString)) return new EnumSchema({ values: source, required: true });
    throw new SourceParserError(`Not supported array type for schema`);
  }

  parseFunction(source: Function): BaseSchema {
    return this.parse(source());
  }

  parseClass<T>(source: { new (...args: any[]): T; schema?: object }): BaseSchema {
    const schema: Record<string, BaseSchema> = {};
    const entries = Object.entries(source.schema ?? {});

    for (const [key, value] of entries) schema[key] = this.parse(value);

    return new Schema({ schema, proto: source.prototype });
  }

  #parseSourceSchema(source: object & SchemaObject): BaseSchema {
    let proto = null;
    let obj = source;
    if (['Prototype', 'Constructor'].includes(ObjectUtils.firstKey(source) ?? '')) {
      const { Prototype, Constructor, ...obj1 } = source;

      proto = Prototype ?? Constructor?.prototype;
      obj = obj1;
    }

    const schemaEntries = Object.entries(obj).map((it) => [it[0], this.parse(it[1])]);

    return new Schema({
      schema: Object.fromEntries(schemaEntries),
      proto,
      required: true,
    });
  }

  #createSchema({ Type, Required = true, Options }: ISource): BaseSchema {
    if (Type === 'link') {
      const name = `${Options[0]}`;
      return new ReferenceSchema({ name, required: Required, load: this.#createLoader(name) });
    }
    const createSchema = createtorSchema[Type];
    if (!createSchema) throw new SourceParserError(`Type "${Type}" is not supported`);
    return createSchema(Required, ...Options);
  }

  #getSourceType(source: unknown) {
    if (Types.isArray(source)) return 'array';
    if (Types.isFunction(source)) return 'function';
    if (Types.isClass(source)) return 'class';
    if (Types.isNull(source)) return 'null';
    return typeof source;
  }

  #isISource(value: unknown): value is ISource {
    if (!Types.isObject(value)) return false;
    return ObjectUtils.firstKey(value) === 'Type';
  }

  #createLoader(name: string): () => BaseSchema | null {
    return () => this.#store.get(name);
  }
}
