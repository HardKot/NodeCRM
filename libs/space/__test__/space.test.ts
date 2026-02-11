import * as path from 'node:path';
import { Space } from '../space';
import { ComponentType } from '../../core';

describe('Space', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads one module', async () => {
    const space = await Space.factory({
      path: path.join(__dirname, 'commonjs', 'appModule'),
      rootModule: 'AppModule',
    });

    expect(space.current.name).toBe('AppModule');
  });

  it('loads module with dependency', async () => {
    const space = await Space.factory({
      path: path.join(__dirname, 'commonjs', 'moduleWithDependency'),
      rootModule: 'AppModule',
    });

    expect(space.current.name).toBe('AppModule');
    const component = space.current.components[0];
    expect(component.name).toBe('AppService');
    expect(component.type).toBe(ComponentType.PROVIDER);
    expect(component.metadata.get('sourcePath').orElse('')).toBe(
      path.join(__dirname, 'commonjs', 'moduleWithDependency', 'app.service.js')
    );

    expect(component.metadata.get('relativePath').orElse('')).toBe('app.service.js');
  });

  it('loads many modules', async () => {
    const space = await Space.factory({
      path: path.join(__dirname, 'commonjs', 'manyModules'),
      rootModule: 'AppModule',
    });

    expect(space.current.name).toBe('AppModule');
    expect(space.current.components[0].name).toBe('AppService');
  });
});
