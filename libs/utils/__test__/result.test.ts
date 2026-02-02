import { Result } from '../result';

describe('Result', () => {
  it('Создание успешного результата', () => {
    const result = Result.success(42);
    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.getOrNull()).toBe(42);
  });
  it('Создание неудачного результата', () => {
    const error = new Error('Something went wrong');
    const result = Result.failure<number>(error);
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.errorOrNull()).toBe(error);
  });
  it('Получение значения с getOrThrow', () => {
    const result = Result.success('Hello');
    expect(result.getOrThrow()).toBe('Hello');
  });
  it('Получение значения с getOrElse', () => {
    const error = new Error('Error');
    const result = Result.failure<string>(error);
    expect(result.getOrElse('Default')).toBe('Default');
  });
  it('Использование fold для обработки результатов', () => {
    const successResult = Result.success(10);
    const failureResult = Result.failure<number>(new Error('Fail'));

    const successFold = successResult.fold(
      value => `Success: ${value}`,
      error => `Failure: ${error.message}`
    );
    const failureFold = failureResult.fold(
      value => `Success: ${value}`,
      error => `Failure: ${error.message}`
    );

    expect(successFold).toBe('Success: 10');
    expect(failureFold).toBe('Failure: Fail');
  });

  it('Преобразование значения с помощью map', () => {
    const result = Result.success(5);
    const mappedResult = result.map(value => value * 2);

    expect(mappedResult.isSuccess).toBe(true);
    expect(mappedResult.getOrNull()).toBe(10);
  });
});
