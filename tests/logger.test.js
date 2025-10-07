import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { Logger, LogLevel, LogFilters } from '../lib/logger/index.js';

describe('Logger', () => {
  let testLogger;
  let logOutput;

  beforeEach(() => {
    logOutput = [];

    // Создаем тестовый транспорт, который сохраняет логи в массив
    const testTransport = logEntry => {
      logOutput.push(logEntry);
    };

    testLogger = new Logger({
      severity: LogLevel.DEBUG,
      transport: [testTransport],
      colorize: false,
      showEmoji: false,
    });
  });

  afterEach(() => {
    logOutput = [];
  });

  test('should create logger with default config', () => {
    const logger = new Logger();
    expect(logger).toBeDefined();
    expect(logger.config.severity).toBe(LogLevel.INFO);
  });

  test('should log messages at different levels', () => {
    testLogger.debug('Debug message');
    testLogger.info('Info message');
    testLogger.warn('Warning message');
    testLogger.error('Error message');

    expect(logOutput).toHaveLength(4);
    expect(logOutput[0].levelName).toBe('DEBUG');
    expect(logOutput[1].levelName).toBe('INFO ');
    expect(logOutput[2].levelName).toBe('WARN ');
    expect(logOutput[3].levelName).toBe('ERROR');
  });

  test('should respect severity level', () => {
    const warnLogger = new Logger({
      severity: LogLevel.WARN,
      transport: [entry => logOutput.push(entry)],
    });

    warnLogger.debug('Should not appear');
    warnLogger.info('Should not appear');
    warnLogger.warn('Should appear');
    warnLogger.error('Should appear');

    expect(logOutput).toHaveLength(2);
    expect(logOutput[0].levelName).toBe('WARN ');
    expect(logOutput[1].levelName).toBe('ERROR');
  });

  test('should apply filters correctly', () => {
    const filteredLogger = new Logger({
      severity: LogLevel.DEBUG,
      transport: [entry => logOutput.push(entry)],
      filters: [LogFilters.contains('IMPORTANT')],
    });

    filteredLogger.info('Regular message');
    filteredLogger.info('IMPORTANT message');

    expect(logOutput).toHaveLength(1);
    expect(logOutput[0].message).toBe('IMPORTANT message');
  });

  test('should create child loggers with inherited config', () => {
    const parentLogger = new Logger({ prefix: 'PARENT' });
    const childLogger = parentLogger.extend({ prefix: ':CHILD' });

    expect(childLogger.config.prefix).toBe('PARENT:CHILD');
  });

  test('should format timestamps correctly', () => {
    const timestamp = new Date('2025-10-04T10:00:00.000Z');
    const formatted = testLogger.formatTimestamp(timestamp);

    expect(formatted).toBe('2025-10-04T10:00:00.000Z');
  });

  test('should sanitize sensitive data', async () => {
    const { LogUtils } = await import('../lib/logger/crm-loggers.js');

    const sensitiveData = {
      username: 'john',
      email: 'john@example.com',
      password: 'secret123',
      token: 'jwt_token_here',
    };

    const sanitized = LogUtils.sanitizeObject(sensitiveData);

    expect(sanitized.username).toBe('john');
    expect(sanitized.email).toBe('john@example.com');
    expect(sanitized.password).toBe('***REDACTED***');
    expect(sanitized.token).toBe('***REDACTED***');
  });
});
