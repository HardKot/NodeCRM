import { describe, it, expect, jest } from '@jest/globals';
import { Handler, ConsumerError } from '../handler.js';
import { AccessError } from '../access.js';
import stream from 'node:stream';
import streamWeb from 'node:stream/web';

describe('Consumer', () => {
  describe('constructor', () => {
    it('should throw error if runner is not a function', () => {
      expect(() => new Handler('not a function', {})).toThrow(ConsumerError);
      expect(() => new Handler('not a function', {})).toThrow('Consumer runner must be a function');
    });

    it('should create consumer with basic metadata', () => {
      const runner = jest.fn();
      const consumer = new Handler(runner, {});

      expect(consumer).toBeInstanceOf(Handler);
      expect(consumer.params).toBeUndefined();
      expect(consumer.body).toBeNull();
      expect(consumer.returns).toBeNull();
    });

    it('should set body as stream for Readable', () => {
      const runner = jest.fn();
      const consumer = new Handler(runner, { body: stream.Readable });

      expect(consumer.body).toBe(stream.Readable);
    });

    it('should set returns as stream for Writable', () => {
      const runner = jest.fn();
      const consumer = new Handler(runner, { returns: stream.Writable });

      expect(consumer.returns).toBe(stream.Writable);
    });
  });

  describe('run', () => {
    it('should execute runner and return success result', async () => {
      const runner = jest.fn().mockResolvedValue({ data: 'test' });
      const consumer = new Handler(runner, { access: 'public' });

      const result = await consumer.run(null);

      expect(result.isSuccess).toBe(true);
      expect(runner).toHaveBeenCalledWith({ body: null, params: {}, user: null });
    });

    it('should return failure if access is denied', async () => {
      const runner = jest.fn();
      const access = jest.fn().mockResolvedValue(false);
      const consumer = new Handler(runner, { access });

      const result = await consumer.run(null);

      expect(result.isFailure).toBe(true);
      expect(result.errorOrNull()).toBeInstanceOf(AccessError);
      expect(runner).not.toHaveBeenCalled();
    });

    it('should pass body, params and user to runner', async () => {
      const runner = jest.fn().mockResolvedValue(null);
      const consumer = new Handler(runner, {
        access: 'public',
        body: { test: 'string' },
        params: { id: 'number' },
      });
      const body = { test: 'data' };
      const params = { id: 1 };
      const user = { name: 'test' };

      await consumer.run(body, user, params);

      expect(runner).toHaveBeenCalledWith({ body, params, user });
    });

    it('should catch and return errors as failure', async () => {
      const error = new Error('Test error');
      const runner = jest.fn().mockRejectedValue(error);
      const consumer = new Handler(runner, { access: 'public' });

      const result = await consumer.run(null);

      expect(result.isFailure).toBe(true);
      expect(result.errorOrNull()).toBe(error);
    });
  });

  describe('bodyIsStream', () => {
    it('should return true for stream.Readable', () => {
      const runner = jest.fn();
      const consumer = new Handler(runner, { body: stream.Readable });

      expect(consumer.bodyIsStream()).toBe(true);
    });

    it('should return true for streamWeb.ReadableStream', () => {
      const runner = jest.fn();
      const consumer = new Handler(runner, { body: streamWeb.ReadableStream });

      expect(consumer.bodyIsStream()).toBe(true);
    });

    it('should return false for non-stream body', () => {
      const runner = jest.fn();
      const consumer = new Handler(runner, {});

      expect(consumer.bodyIsStream()).toBe(false);
    });
  });

  describe('returnsIsStream', () => {
    it('should return true for stream.Writable', () => {
      const runner = jest.fn();
      const consumer = new Handler(runner, { returns: stream.Writable });

      expect(consumer.returnsIsStream()).toBe(true);
    });

    it('should return true for streamWeb.WritableStream', () => {
      const runner = jest.fn();
      const consumer = new Handler(runner, { returns: streamWeb.WritableStream });

      expect(consumer.returnsIsStream()).toBe(true);
    });

    it('should return false for non-stream returns', () => {
      const runner = jest.fn();
      const consumer = new Handler(runner, {});

      expect(consumer.returnsIsStream()).toBe(false);
    });
  });
});
