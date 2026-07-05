import { BaseSchema } from '../schemas';

export type { ISchemaManager };

interface ISchemaManager {
  get(name: string): BaseSchema;

  parser(value: object): BaseSchema;
}
