import { ObjectUtils } from '../objectUtils';

describe('ObjectUtils -> firstNotNullValue', () => {
  it('Возвращает первое ненулевое значение свойства из переданных объектов', () => {
    const obj1 = { a: null, b: 2 };
    const obj2 = { a: 1, b: null };
    const obj3 = { a: 3, b: 4 };

    expect(ObjectUtils.firstNotNullValue('a', obj1, obj2, obj3)).toBe(1);
    expect(ObjectUtils.firstNotNullValue('b', obj1, obj2, obj3)).toBe(2);
    expect(ObjectUtils.firstNotNullValue('c', obj1, obj2, obj3)).toBeNull();
  });
});

describe('ObjectUtils -> goTo', () => {
  const testObj = {
    a: {
      b: {
        c: 42,
      },
    },
    x: null,
  };

  it('Возвращает значение по указанному пути', () => {
    expect(ObjectUtils.goTo(testObj, 'a.b.c')).toBe(42);
  });

  it('Возвращает значение по указанному пути с дефолтным значением', () => {
    expect(ObjectUtils.goTo(testObj, 'a.b.d', 'default')).toBe('default');
  });

  it('Возвращает undefined для несуществующего пути без дефолтного значения', () => {
    expect(ObjectUtils.goTo(testObj, 'a.b.d')).toBeUndefined();
  });

  it('Корректно обрабатывает null значения на пути', () => {
    expect(ObjectUtils.goTo(testObj, 'x.y.z', 'default')).toBe('default');
  });
});

describe('ObjectUtils -> deepFreeze', () => {
  it('Глубоко замораживает объект', () => {
    const obj = {
      a: {
        b: 2,
      },
      c: [1, 2, 3],
    };

    const frozenObj = ObjectUtils.deepFreeze(obj);

    expect(Object.isFrozen(frozenObj)).toBe(true);
    expect(Object.isFrozen(frozenObj.a)).toBe(true);
    expect(Object.isFrozen(frozenObj.c)).toBe(true);
  });
});

describe('ObjectUtils -> deepAssign', () => {
  it('Глубоко объединяет объекты', () => {
    type TestType = {
      a: {
        b?: number;
        d?: number;
      };
      c?: number;
      e?: number;
    };

    const target: TestType = {
      a: {
        b: 1,
      },
      c: 2,
    };

    const source1: TestType = {
      a: {
        d: 3,
      },
      e: 4,
    };

    const source2: TestType = {
      a: {
        b: 5,
      },
    };

    const result = ObjectUtils.deepAssign(target, source1, source2);

    expect(result).toEqual({
      a: {
        b: 5,
        d: 3,
      },
      c: 2,
      e: 4,
    });
  });
});

describe('ObjectUtils -> getMethodNames', () => {
  it('Возвращает имена методов объекта', () => {
    class TestClass {
      method1() {}
      method2() {}
      prop1 = 42;
    }

    const instance = new TestClass();
    const methodNames = ObjectUtils.getMethodNames(instance);

    expect(methodNames).toContain('method1');
    expect(methodNames).toContain('method2');
    expect(methodNames).not.toContain('prop1');
  });
});
