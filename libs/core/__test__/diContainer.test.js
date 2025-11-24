import { describe, beforeEach, test, expect, jest } from '@jest/globals';

import { DiContainer, DiContainerError, DiScope } from '../diContainer.js';

class AComponent {}

class BComponent {
  constructor(aComponent) {
    this.a = aComponent;
  }
}

class CComponent {
  constructor() {
    this.init = jest.fn();
  }
}

describe('Dependency container', () => {
  let container;

  beforeEach(() => {
    container = new DiContainer();
  });

  test('Get simple component', () => {
    container.registration('AComponent', AComponent);

    expect(container.get('AComponent')).toBeInstanceOf(AComponent);
  });

  test('Get not registration component', () => {
    expect(() => container.get('AComponent')).toThrow(DiContainerError);
  });

  test('Get component with dependencies', () => {
    container
      .registration('AComponent', AComponent)
      .registration('BComponent', BComponent, { dependencies: ['AComponent'] });

    expect(container.get('BComponent')).toBeInstanceOf(BComponent);
    expect(container.get('BComponent').a).toBeInstanceOf(AComponent);
  });

  test('Get component with PostConstructor', () => {
    container.registration('CComponent', CComponent, { postConstructor: 'init' });

    expect(container.get('CComponent').init).toHaveBeenCalled();
  });

  test('Build singleton', () => {
    container
      .registration('AComponent', AComponent)
      .registration('BComponent', BComponent, { dependencies: ['AComponent'] });

    const a = container.get('AComponent');
    const b = container.get('BComponent');

    expect(b.a).toBe(a);
  });

  test('Build with prototype', () => {
    container
      .registration('AComponent', AComponent, { scope: DiScope.Prototype })
      .registration('BComponent', BComponent, { dependencies: ['AComponent'] });

    const a = container.get('AComponent');
    const b = container.get('BComponent');

    expect(b.a).not.toBe(a);
  });

  test('Get by tag', () => {
    container
      .registration('AComponent', AComponent, { tags: ['first'] })
      .registration('BComponent', BComponent, { tags: ['first'] })
      .registration('CComponent', CComponent);

    const list = container.getListByTag('first');
    expect(list).toHaveLength(2);
    expect(list[0]).toBeInstanceOf(AComponent);
    expect(list[1]).toBeInstanceOf(BComponent);
  });

  test('Get by tag, if tag is null/undefiend', () => {
    container
      .registration('AComponent', AComponent, { tags: ['first'] })
      .registration('BComponent', BComponent, { tags: ['first'] })
      .registration('CComponent', CComponent);

    expect(container.getListByTag()).toHaveLength(0);
    expect(container.getListByTag(null)).toHaveLength(0);
  });

  test('Get by tag, if tag is not used', () => {
    container
      .registration('AComponent', AComponent, { tags: ['first'] })
      .registration('BComponent', BComponent, { tags: ['first'] })
      .registration('CComponent', CComponent);

    expect(container.getListByTag('second')).toHaveLength(0);
  });
});
