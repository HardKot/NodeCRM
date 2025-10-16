import { describe, test, expect, jest } from '@jest/globals';

describe('CRM Utils', () => {
  test('should generate unique correlation IDs', async () => {
    const { LogUtils } = await import('../src/logger/crm-loggers.js');

    const id1 = LogUtils.generateCorrelationId();
    const id2 = LogUtils.generateCorrelationId();

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
  });

  test('should format errors correctly', async () => {
    const { LogUtils } = await import('../src/logger/crm-loggers.js');

    const error = new Error('Test error');
    error.code = 'TEST_CODE';

    const formatted = LogUtils.formatError(error);

    expect(formatted.name).toBe('Error');
    expect(formatted.message).toBe('Test error');
    expect(formatted.code).toBe('TEST_CODE');
    expect(formatted.stack).toBeDefined();
  });

  test('should measure execution time', async () => {
    const { LogUtils } = await import('../src/logger/crm-loggers.js');

    const mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
    };

    const slowFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'result';
    };

    const result = await LogUtils.measureTime(slowFunction, mockLogger, 'Test Operation');

    expect(result).toBe('result');
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Test Operation completed',
      expect.objectContaining({
        duration: expect.stringMatching(/\d+ms/),
      })
    );
  });

  test('should handle errors in measureTime', async () => {
    const { LogUtils } = await import('../src/logger/crm-loggers.js');

    const mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
    };

    const errorFunction = async () => {
      throw new Error('Test error');
    };

    await expect(
      LogUtils.measureTime(errorFunction, mockLogger, 'Failing Operation')
    ).rejects.toThrow('Test error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failing Operation failed',
      expect.objectContaining({
        duration: expect.stringMatching(/\d+ms/),
        error: expect.objectContaining({
          message: 'Test error',
        }),
      })
    );
  });
});
