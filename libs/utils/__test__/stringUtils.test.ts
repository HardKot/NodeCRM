import { StringUtils } from '../stringUtils';

describe('StringUtils', () => {
  it('factoryCamelCase работает корректно', () => {
    expect(StringUtils.factoryCamelCase('hello', 'world')).toBe('helloWorld');
    expect(StringUtils.factoryCamelCase('Hello', '  World')).toBe('helloWorld');
  });

  it('factoryPascalCase работает корректно', () => {
    expect(StringUtils.factoryPascalCase('hello', 'world')).toBe('HelloWorld');
    expect(StringUtils.factoryPascalCase('Hello', '  World')).toBe('HelloWorld');
  });
});
