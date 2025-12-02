import { describe, it, expect, beforeEach } from '@jest/globals';
import { Routes } from '../routes.js';

describe('ControllerNode', () => {
  let rootNode;

  beforeEach(() => {
    rootNode = new Routes();
  });

  it.each([
    ['/', 'root-value'],
    ['/home', 'home-value'],
    ['/home/statistic', 'home-statistic-value'],
  ])('should add a value with path "%s"', (mapping, value) => {
    rootNode.register(value, mapping);

    expect(rootNode.route(mapping).get).toBe(value);
  });

  it.each([
    ['', 'root-value'],
    ['home', 'home-value'],
    ['home/statistic', 'home-statistic-value'],
  ])('should handle path without leading slash "%s"', (mapping, value) => {
    rootNode.register(value, mapping);

    expect(rootNode.route(mapping).get).toBe(value);
  });

  it('should return null for non-existing path', () => {
    rootNode.register('some-value', '/some/path');

    expect(rootNode.route('/non/existing/path')).toBeNull();
  });

  it('should handle dynamic segments in the path', () => {
    rootNode.register('user-123-value', '/user/<number>');
    rootNode.register('post-123-value', '/post/<number>');

    expect(rootNode.route('/user/123').get).toBe('user-123-value');
    expect(rootNode.route('/user/456').get).toBe('user-123-value');
    expect(rootNode.route('/post/777').get).toBe('post-123-value');
  });
});
