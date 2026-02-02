import { FunctionUtils } from '../functionUtils';

describe('functionUtils -> curry', () => {
  it.each([
    { preset: [5], rest: [10], result: 15 },
    { preset: [2, 3], rest: [4], result: 9 },
  ])('%#. Каррирование функции с аргументами $preset', ({ preset, result, rest }) => {
    const add = (a: number, b: number, c = 0) => a + b + c;
    const add5 = FunctionUtils.curry(add, ...preset);
    expect(add5(...rest)).toBe(result);
  });
});
