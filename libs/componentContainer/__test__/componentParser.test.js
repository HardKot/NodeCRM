import { beforeEach, describe, it, expect } from '@jest/globals';
import { ComponentParser } from '../componentParser.js';

describe('ComponentParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ComponentParser();
  });

  it('parsers a object source', () => {
    const MyComponent = {
      constructor: () => ({}),
      dependencies: ['dep1', 'dep2'],
      postConstructor: () => {},
      scope: 'SINGLETON',
    };

    const component = parser.parse(MyComponent);

    expect(component.constructor).toBeInstanceOf(Function);
    expect(component.dependencies).toEqual(['dep1', 'dep2']);
    expect(component.postConstructor).toBeInstanceOf(Function);
    expect(component.scope).toBeDefined();
  });

  it('parsers a function source', () => {
    function MyComponent() {
      return {};
    }
    MyComponent.dependencies = ['depA', 'depB'];

    const component = parser.parse(MyComponent);

    expect(component.constructor).toBeInstanceOf(Function);
    expect(component.dependencies).toEqual(['depA', 'depB']);
    expect(component.scope).toBeDefined();
  });

  it('parsers a class source', () => {
    class MyComponent {
      static dependencies = ['depA', 'depB'];
    }

    const component = parser.parse(MyComponent);

    expect(component.constructor).toBeInstanceOf(Function);
    expect(component.dependencies).toEqual(['depA', 'depB']);
    expect(component.scope).toBeDefined();
  });
});
