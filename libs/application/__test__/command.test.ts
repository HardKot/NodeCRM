import { Command, AccessError, CommandMetadata } from '../command';
import { Session } from '../../security/session';
import { Metadata } from '../../core/metadata';
import { SchemaRegistry } from '../../schema';

import { Readable, Writable } from 'node:stream';
import { ReadableStream, WritableStream } from 'node:stream/web';

describe('Command', () => {
  let metadata: Metadata;
  let schemaRegistry: SchemaRegistry;

  beforeEach(() => {
    metadata = new Metadata();
    schemaRegistry = new SchemaRegistry();
  });

  describe('constructor', () => {
    it('should create handler with basic metadata', () => {
      const runner = jest.fn();
      const handler = Command.createFromFunction(runner, metadata, schemaRegistry);

      expect(handler).toBeInstanceOf(Command);
      expect(handler.params).toBeNull();
      expect(handler.body).toBeNull();
      expect(handler.returns).toBeNull();
    });

    it('should set body as stream for Readable', () => {
      const runner = jest.fn();
      metadata.set(CommandMetadata.BodySymbol, Readable);
      const handler = Command.createFromFunction(runner, metadata, schemaRegistry);

      expect(handler.body).toBe(Readable);
    });

    it('should set returns as stream for Writable', () => {
      const runner = jest.fn();
      metadata.set(CommandMetadata.ReturnsSymbol, Writable);

      const handler = Command.createFromFunction(runner, metadata, schemaRegistry);

      expect(handler.returns).toBe(Writable);
    });
  });

  describe('run', () => {
    it('should execute runner and return success result', async () => {
      const runner = jest.fn().mockResolvedValue({ data: 'test' });
      metadata.set(CommandMetadata.AccessSymbol, 'public');

      const handler = Command.createFromFunction(runner, metadata, schemaRegistry);
      const session = new Session();

      const result = await handler.run(null, session);

      expect(result.isSuccess).toBe(true);
      expect(runner).toHaveBeenCalledWith({ body: null, params: null, session: session });
    });

    it('should return failure if access is denied', async () => {
      const runner = jest.fn();
      metadata.set(CommandMetadata.AccessSymbol, 'private');
      const handler = Command.createFromFunction(runner, metadata, schemaRegistry);

      const result = await handler.run(null);

      expect(result.isFailure).toBe(true);
      expect(result.errorOrNull()).toBeInstanceOf(AccessError);
      expect(runner).not.toHaveBeenCalled();
    });

    it('should pass body, params and user to runner', async () => {
      const runner = jest.fn().mockResolvedValue(null);
      metadata.set(CommandMetadata.AccessSymbol, 'public');
      metadata.set(CommandMetadata.BodySymbol, { test: 'string' });
      metadata.set(CommandMetadata.ParamsSymbol, { id: 'number' });

      const handler = Command.createFromFunction(runner, metadata, schemaRegistry);
      const body = { test: 'data' };
      const params = { id: 1 };
      const session = new Session();

      await handler.run(body, session, params);

      expect(runner).toHaveBeenCalledWith({ body, params, session });
    });

    it('should catch and return errors as failure', async () => {
      const error = new Error('Test error');
      const runner = jest.fn().mockRejectedValue(error);
      metadata.set(CommandMetadata.AccessSymbol, 'public');

      const handler = Command.createFromFunction(runner, metadata, schemaRegistry);

      const result = await handler.run(null);

      expect(result.isFailure).toBe(true);
      expect(result.errorOrNull()).toBe(error);
    });
  });
});
