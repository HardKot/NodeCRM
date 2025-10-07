import { describe, test, expect, beforeEach } from '@jest/globals';
import { field, FieldTypes } from '../lib/orm/index.js';

describe('ORM Field Builder', () => {
  test('should create ID field correctly', () => {
    const idField = field.id();

    expect(idField.type).toBe(FieldTypes.SERIAL);
    expect(idField.primaryKey).toBe(true);
    expect(idField.autoIncrement).toBe(true);
  });

  test('should create varchar field with options', () => {
    const nameField = field.varchar(100, { nullable: false, unique: true });

    expect(nameField.type).toBe('VARCHAR(100)');
    expect(nameField.nullable).toBe(false);
    expect(nameField.unique).toBe(true);
  });

  test('should create timestamp field with default', () => {
    const timestampField = field.timestamp();

    expect(timestampField.type).toBe(FieldTypes.TIMESTAMP);
    expect(timestampField.default).toBe('CURRENT_TIMESTAMP');
  });

  test('should create foreign key field', () => {
    const clientIdField = field.belongsTo('clients', 'id');

    expect(clientIdField.type).toBe(FieldTypes.INTEGER);
    expect(clientIdField.references).toEqual({ table: 'clients', field: 'id' });
  });

  test('should generate correct SQL for field', () => {
    const emailField = field.varchar(255, { nullable: false, unique: true });
    const sql = emailField.toSQL('email');

    expect(sql).toBe('email VARCHAR(255) NOT NULL UNIQUE');
  });

  test('should handle boolean field with default', () => {
    const activeField = field.boolean({ default: true });
    const sql = activeField.toSQL('is_active');

    expect(sql).toBe('is_active BOOLEAN DEFAULT true');
  });

  test('should handle decimal field with precision', () => {
    const priceField = field.decimal(10, 2);

    expect(priceField.type).toBe('DECIMAL(10,2)');
  });
});
