import { Types, TypeError } from '../types';

describe('Types', () => {
  it('Проверка isObject', () => {
    expect(Types.isObject({})).toBe(true);
    expect(Types.isObject([])).toBe(false);
    expect(Types.isObject(null)).toBe(false);
  });

  it('Проверка isFunction и isClass', () => {
    function func() {}
    class MyClass {}
    expect(Types.isFunction(func)).toBe(true);
    expect(Types.isClass(MyClass)).toBe(true);
    expect(Types.isFunction(MyClass)).toBe(false);
  });

  it('Проверка isPrimitive', () => {
    expect(Types.isPrimitive(42)).toBe(true);
    expect(Types.isPrimitive('hello')).toBe(true);
    expect(Types.isPrimitive(null)).toBe(false);
    expect(Types.isPrimitive({})).toBe(false);
  });

  it('Проверка notNull', () => {
    expect(Types.notNull({})).toBe(true);
    expect(Types.notNull(42)).toBe(false);
    expect(Types.notNull(null)).toBe(false);
  });

  it('Проверка isNumber и isInt', () => {
    expect(Types.isNumber(42)).toBe(true);
    expect(Types.isNumber(NaN)).toBe(false);
    expect(Types.isInt(42)).toBe(true);
    expect(Types.isInt(42.5)).toBe(false);
  });

  it('Проверка isString', () => {
    expect(Types.isString('hello')).toBe(true);
    expect(Types.isString(42)).toBe(false);
  });

  it('Проверка isUndefined и isSymbol', () => {
    expect(Types.isUndefined(undefined)).toBe(true);
    expect(Types.isUndefined(null)).toBe(false);
    expect(Types.isSymbol(Symbol('sym'))).toBe(true);
    expect(Types.isSymbol('not a symbol')).toBe(false);
  });

  it('Проверка асинхронный итератор', async () => {});
});
