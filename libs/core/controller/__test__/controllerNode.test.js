import { describe, it, expect, beforeEach } from '@jest/globals';
import { ControllerNode } from '../controllerNode.js';

describe('ControllerNode', () => {
  let rootNode;

  beforeEach(() => {
    rootNode = new ControllerNode();
  });

  it.each([
    ['/', 'root-value'],
    ['/home', 'home-value'],
    ['/home/statistic', 'home-statistic-value'],
  ])('should add a value with path "%s"', (mapping, value) => {
    rootNode.addValue(value, mapping);

    expect(rootNode.getValue(mapping)).toBe(value);
  });

  it.each([
    ['', 'root-value'],
    ['home', 'home-value'],
    ['home/statistic', 'home-statistic-value'],
  ])('should handle path without leading slash "%s"', (mapping, value) => {
    rootNode.addValue(value, mapping);

    expect(rootNode.getValue(mapping)).toBe(value);
  });

  it('should return null for non-existing path', () => {
    rootNode.addValue('some-value', '/some/path');

    expect(rootNode.getValue('/non/existing/path')).toBeNull();
  });

  it('should handle dynamic segments in the path', () => {
    rootNode.addValue('user-123-value', '/user/<id>');
    rootNode.addValue('post-123-value', '/post/<id>');

    expect(rootNode.getValue('/user/123')).toBe('user-123-value');
    expect(rootNode.getValue('/user/456')).toBe('user-123-value');
    expect(rootNode.getValue('/post/777')).toBe('post-123-value');
  });
});
