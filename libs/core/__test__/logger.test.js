import stream from 'node:stream';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Logger } from '../logger.js';

const timeNow = Date.parse('01.01.2025');
jest.useFakeTimers({ now: timeNow });

describe('Logger', () => {
  let outputData;
  let errorData;

  const stdout = new stream.Writable({
    write(chunk, encoding, callback) {
      outputData += chunk.toString().replace(/\u001b\[\d+m/g, '');
      callback();
    },
  });

  const stderr = new stream.Writable({
    write(chunk, encoding, callback) {
      errorData += chunk.toString().replace(/\u001b\[\d+m/g, '');
      callback();
    },
  });

  beforeEach(() => {
    outputData = '';
    errorData = '';
    process.env.FORCE_COLOR = '0';
  });

  it('write in stdout', () => {
    const logger = new Logger({ stdout });

    logger.log('test log');
    logger.info('test info');
    logger.warn('test warn');
    logger.error('test error');

    expect(outputData).toContain(`${timeNow} | LOG | test log`);
    expect(outputData).toContain(`${timeNow} | INFO | test info`);
    expect(outputData).toContain(`${timeNow} | WARN | test warn`);
    expect(outputData).toContain(`${timeNow} | ERROR | test error`);
  });

  it('write in stdout and stderr', () => {
    const logger = new Logger({ stdout, stderr });

    logger.log('test log');
    logger.info('test info');
    logger.warn('test warn');
    logger.error('test error');

    expect(outputData).toContain(`${timeNow} | LOG | test log`);
    expect(outputData).toContain(`${timeNow} | INFO | test info`);
    expect(errorData).toContain(`${timeNow} | WARN | test warn`);
    expect(errorData).toContain(`${timeNow} | ERROR | test error`);
  });

  it('create logger with prefix', () => {
    const logger = new Logger({ stdout, prefix: 'MyApp' });
    logger.info('test info with prefix');
    expect(outputData).toContain(`${timeNow} | MyApp | INFO | test info with prefix`);
  });

  it('extend logger', () => {
    const logger = new Logger({ stdout, prefix: 'MyApp' });
    const childLogger = logger.extend('ModuleA');
    childLogger.warn('test warn from child logger');
    expect(outputData).toContain(`${timeNow} | ModuleA | WARN | test warn from child logger`);
  });

  it('write multiple arguments', () => {
    const logger = new Logger({ stdout });
    logger.info('test', 'info', 123, { key: 'value' });
    expect(outputData).toContain(`${timeNow} | INFO | test info 123 { key: 'value' }`);
  });

  it('write error', () => {
    const logger = new Logger({ stderr, stdout });
    logger.error('An error occurred:', new Error('Test error'));
    expect(errorData).toContain(`${timeNow} | ERROR | An error occurred: Error: Test error`);
  });
});
