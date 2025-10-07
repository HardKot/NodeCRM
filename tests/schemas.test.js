import { describe, test, expect } from '@jest/globals';
import { clientSchema } from '../schemas/client.js';
import { leadSchema } from '../schemas/lead.js';
import { taskSchema } from '../schemas/task.js';

describe('Schemas Validation', () => {
  test('client schema should have required structure', () => {
    expect(clientSchema.tableName).toBe('clients');
    expect(clientSchema.fields).toBeDefined();
    expect(clientSchema.fields.id).toBeDefined();
    expect(clientSchema.fields.name).toBeDefined();
    expect(clientSchema.fields.email).toBeDefined();

    // Проверяем валидации
    expect(clientSchema.validations).toBeDefined();
    expect(typeof clientSchema.validations.email).toBe('function');
    expect(typeof clientSchema.validations.name).toBe('function');

    // Проверяем хуки
    expect(clientSchema.hooks).toBeDefined();
    expect(typeof clientSchema.hooks.beforeCreate).toBe('function');
  });

  test('lead schema should have business logic', () => {
    expect(leadSchema.tableName).toBe('leads');
    expect(leadSchema.fields.probability).toBeDefined();
    expect(leadSchema.fields.value).toBeDefined();

    // Проверяем валидацию вероятности
    expect(() => {
      leadSchema.validations.probability(150); // Больше 100
    }).toThrow('Вероятность должна быть от 0 до 100');

    expect(() => {
      leadSchema.validations.probability(50); // Валидное значение
    }).not.toThrow();
  });

  test('task schema should validate dates', () => {
    expect(taskSchema.tableName).toBe('tasks');
    expect(taskSchema.fields.due_date).toBeDefined();

    // Проверяем валидацию даты в прошлом
    const pastDate = new Date(Date.now() - 86400000); // Вчера
    expect(() => {
      taskSchema.validations.due_date(pastDate);
    }).toThrow('Срок выполнения не может быть в прошлом');
  });

  test('email validation should work correctly', () => {
    const emailValidator = clientSchema.validations.email;

    expect(() => {
      emailValidator('valid@example.com');
    }).not.toThrow();

    expect(() => {
      emailValidator('invalid-email');
    }).toThrow('Неверный формат email');

    expect(() => {
      emailValidator('another@valid.email.com');
    }).not.toThrow();
  });

  test('status validation should accept valid values', () => {
    const statusValidator = clientSchema.validations.status;

    expect(() => {
      statusValidator('active');
    }).not.toThrow();

    expect(() => {
      statusValidator('inactive');
    }).not.toThrow();

    expect(() => {
      statusValidator('invalid_status');
    }).toThrow();
  });
});
