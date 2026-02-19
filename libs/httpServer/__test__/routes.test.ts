import { Routes } from '../routes';
import { Handle } from '../handle';
import { RESTMethod } from '../types';

describe('ControllerNode', () => {
  let wrapperHandler = (name: string, path: string, method: RESTMethod) => {
    return new Handle(name, path, method, 200, null, null, null);
  }

  it('should add a value with path Static', () => {
    const rootNode = Routes.byHandlers([
      wrapperHandler("root-value", "/", 'get'),
      wrapperHandler("home-value", "/home", 'get'),
      wrapperHandler("home-statistic-value", "/home/statistic", 'get')
    ]);


    expect(rootNode('/', 'get')?.name).toBe('root-value');
    expect(rootNode('/home/statistic', 'get')?.name).toBe('home-statistic-value');

  });


  it('should return null for non-existing path', () => {
    const rootNode = Routes.byHandlers([
      wrapperHandler('some-value', '/some/path', 'get'),

    ]);

    expect(rootNode('/non/existing/path', 'get')).toBeNull();
  });

  it('should handle dynamic segments in the path', () => {
    const rootNode = Routes.byHandlers([
      wrapperHandler('user-123-value', '/user/<number>', 'get'),
      wrapperHandler('post-123-value', '/post/<number>', 'get'),
      wrapperHandler('home-statistic-value', '/home/statistic', 'get'),
    ]);


    expect(rootNode('/user/123', 'get')?.name).toBe('user-123-value');
    expect(rootNode('/user/456', 'get')?.name).toBe('user-123-value');
    expect(rootNode('/post/777', 'get')?.name).toBe('post-123-value');
  });
});
