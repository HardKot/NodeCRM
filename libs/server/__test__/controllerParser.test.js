import { describe, it, expect, beforeEach } from '@jest/globals';
import { ControllerParser } from '../controllerParser.js';

describe('ControllerParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ControllerParser({
      factorySchema: schema => schema, // Mock schema parser
    });
  });

  it('should parse object with single method', () => {
    const mockHandler = () => {};
    const source = {
      mapping: '/api',
      handler: mockHandler,
      body: { schema: 'test' },
      params: { id: 'number' },
      dependencies: ['dep1'],
      guard: () => true,
    };

    const result = parser.parseObject(source);

    expect(result).toHaveLength(1);
    expect(result[0].callback).toBe(mockHandler);
    expect(result[0].mapping).toEqual('/api');
  });

  it('should parse object with multiple HTTP methods', () => {
    const source = {
      mapping: '/users',
      get: () => {},
      post: () => {},
      put: () => {},
      delete: () => {},
      patch: () => {},
    };

    const result = parser.parseObject(source);

    expect(result).toHaveLength(5);
  });

  it('should handle extensions as array', () => {
    const subController = {
      mapping: 'sub',
      handler: () => {},
    };
    const source = {
      mapping: '/api',
      handler: () => {},
      imports: [subController],
    };

    const result = parser.parseObject(source);

    expect(result).toHaveLength(2);
    expect(result[1].mapping).toBe('/api/sub');
  });

  it('path with dinamic segments should parse correctly', () => {
    const source = {
      mapping: '/user/<id>/posts/<postId:number>',
      handler: () => {},
    };

    const result = parser.parseObject(source);

    expect(result).toHaveLength(1);
    expect(result[0].mapping).toBe('/user/<id>/posts/<postId:number>');
    expect(result[0].paramsSchema).toEqual({
      1: { name: 'id', type: 'string' },
      3: { name: 'postId', type: 'number' },
    });
  });
});
