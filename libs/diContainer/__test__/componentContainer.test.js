import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { ComponentContainer, ComponentContainerError } from '../componentContainer.js';
import { Component } from '../component.js';

class TestComponent {}

describe('ComponentContainer', () => {
  let componentContainer;

  beforeEach(() => {
    componentContainer = new ComponentContainer();
  });

  it('registers a component successfully', () => {
    const component = new Component(TestComponent);
    componentContainer.register('testComponent', component);

    expect(componentContainer.components.has('testComponent')).toBe(true);
    expect(componentContainer.components.get('testComponent')).toBe(component);
  });

  it('throws an error when registering a non-Component instance', () => {
    expect(() => componentContainer.register('invalidComponent', {})).toThrow(
      'Component must be an instance of Component class'
    );
  });

  it('builds the dependency graph successfully', () => {
    const componentA = new Component(TestComponent);
    const componentB = new Component(TestComponent, { dependencies: ['componentA'] });

    componentContainer.register('componentA', componentA);
    componentContainer.register('componentB', componentB);

    const graph = componentContainer.buildGraph();

    expect(graph).toEqual({
      componentA: { dependencies: [], dependents: ['componentB'] },
      componentB: { dependencies: ['componentA'], dependents: [] },
    });
  });

  it('throws an error for unregistered dependencies during graph building', () => {
    const component = new Component(TestComponent, { dependencies: ['unregisteredComponent'] });

    componentContainer.register('testComponent', component);

    expect(() => componentContainer.buildGraph()).toThrow(
      'Component "testComponent" has an unregistered dependency "unregisteredComponent"'
    );
  });

  it('detects circular dependencies and throws an error', () => {
    const componentA = new Component(TestComponent, { dependencies: ['componentB'] });
    const componentB = new Component(TestComponent, { dependencies: ['componentA'] });

    componentContainer.register('componentA', componentA);
    componentContainer.register('componentB', componentB);

    expect(() => componentContainer.build()).rejects.toThrow(ComponentContainerError);
  });

  it('builds all components and returns their instances', async () => {
    function factoryA() {
      return { name: 'A' };
    }
    function factoryB() {
      return { name: 'B' };
    }

    const componentA = new Component(factoryA);
    const componentB = new Component(factoryB, { dependencies: ['componentA'] });

    componentContainer.register('componentA', componentA);
    componentContainer.register('componentB', componentB);

    const instances = await componentContainer.build();

    expect(instances).toEqual({
      componentA: { name: 'A' },
      componentB: { name: 'B' },
    });
  });
});
