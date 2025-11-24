import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ControllerParser, ControllerParserError } from '../controllerParser.js';

describe('ControllerParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ControllerParser();
  });

  it('should parse object with single method', () => {
    const mockHandler = () => {};
    const source = {
      mapping: '/api',
      method: mockHandler,
      body: { schema: 'test' },
      params: { id: 'number' },
      dependencies: ['dep1'],
      guard: () => true,
    };

    const result = parser.parseObject(source);

    expect(result).toHaveLength(1);
    expect(result[0].method).toBe(mockHandler);
    expect(result[0].mapping).toEqual({
      path: '/api',
      method: 'get',
    });
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
      method: () => {},
    };
    const source = {
      mapping: '/api',
      method: () => {},
      extensions: [subController],
    };

    const result = parser.parseObject(source);

    expect(result).toHaveLength(2);
    expect(result[1].mapping.path).toBe('/api/sub');
  });

  it('path with dinamic segments should parse correctly', () => {
    const source = {
      mapping: '/user/<id>/posts/<postId:number>',
      method: () => {},
    };

    const result = parser.parseObject(source);

    expect(result).toHaveLength(1);
    expect(result[0].mapping.path).toBe('/user/<string>/posts/<number>');
    expect(result[0].params.path).toEqual({
      1: { name: 'id', type: 'string' },
      3: { name: 'postId', type: 'number' },
    });
  });
});
