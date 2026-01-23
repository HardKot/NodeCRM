import { describe, it, expect, jest } from '@jest/globals';
import { Command, CommandError } from '../command.js';
import { AccessError } from '../access.js';
import stream from 'node:stream';
import streamWeb from 'node:stream/web';

describe('Handler', () => {
  describe('constructor', () => {
    it('should throw error if runner is not a function', () => {
      expect(() => new Command('not a function')).toThrow(CommandError);
      expect(() => new Command('not a function')).toThrow('Consumer runner must be a function');
    });

    it('should create handler with basic metadata', () => {
      const runner = jest.fn();
      const handler = new Command(runner);

      expect(handler).toBeInstanceOf(Command);
      expect(handler.params).toBeNull();
      expect(handler.body).toBeNull();
      expect(handler.returns).toBeNull();
    });

    it('should set body as stream for Readable', () => {
      const runner = jest.fn();
      const handler = new Command(runner, { body: stream.Readable });

      expect(handler.body).toBe(stream.Readable);
    });

    it('should set returns as stream for Writable', () => {
      const runner = jest.fn();
      const handler = new Command(runner, { returns: stream.Writable });

      expect(handler.returns).toBe(stream.Writable);
    });
  });

  describe('run', () => {
    it('should execute runner and return success result', async () => {
      const runner = jest.fn().mockResolvedValue({ data: 'test' });
      const handler = new Command(runner, { access: 'public' });

      const result = await handler.run(null);

      expect(result.isSuccess).toBe(true);
      expect(runner).toHaveBeenCalledWith({ body: null, params: {}, user: null });
    });

    it('should return failure if access is denied', async () => {
      const runner = jest.fn();
      const access = jest.fn().mockResolvedValue(false);
      const handler = new Command(runner, { access });

      const result = await handler.run(null);

      expect(result.isFailure).toBe(true);
      expect(result.errorOrNull()).toBeInstanceOf(AccessError);
      expect(runner).not.toHaveBeenCalled();
    });

    it('should pass body, params and user to runner', async () => {
      const runner = jest.fn().mockResolvedValue(null);
      const handler = new Command(runner, {
        access: 'public',
        body: { test: 'string' },
        params: { id: 'number' },
      });
      const body = { test: 'data' };
      const params = { id: 1 };
      const user = { name: 'test' };

      await handler.run(body, user, params);

      expect(runner).toHaveBeenCalledWith({ body, params, user });
    });

    it('should catch and return errors as failure', async () => {
      const error = new Error('Test error');
      const runner = jest.fn().mockRejectedValue(error);
      const handler = new Command(runner, { access: 'public' });

      const result = await handler.run(null);

      expect(result.isFailure).toBe(true);
      expect(result.errorOrNull()).toBe(error);
    });
  });

  describe('bodyIsStream', () => {
    it('should return true for stream.Readable', () => {
      const runner = jest.fn();
      const handler = new Command(runner, { body: stream.Readable });

      expect(handler.bodyIsStream()).toBe(true);
    });

    it('should return true for streamWeb.ReadableStream', () => {
      const runner = jest.fn();
      const handler = new Command(runner, { body: streamWeb.ReadableStream });

      expect(handler.bodyIsStream()).toBe(true);
    });

    it('should return false for non-stream body', () => {
      const runner = jest.fn();
      const handler = new Command(runner, {});

      expect(handler.bodyIsStream()).toBe(false);
    });
  });

  describe('returnsIsStream', () => {
    it('should return true for stream.Writable', () => {
      const runner = jest.fn();
      const handler = new Command(runner, { returns: stream.Writable });

      expect(handler.returnsIsStream()).toBe(true);
    });

    it('should return true for streamWeb.WritableStream', () => {
      const runner = jest.fn();
      const handler = new Command(runner, { returns: streamWeb.WritableStream });

      expect(handler.returnsIsStream()).toBe(true);
    });

    it('should return false for non-stream returns', () => {
      const runner = jest.fn();
      const handler = new Command(runner, {});

      expect(handler.returnsIsStream()).toBe(false);
    });
  });
});
