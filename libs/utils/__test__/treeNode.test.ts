import { TreeNode } from '../treeNode';

describe('TreeNode', () => {
  it('Создание узла и добавление дочерних узлов', () => {
    const root = new TreeNode('root');
    const child1 = new TreeNode('child1');
    const child2 = new TreeNode('child2');

    root.add(child1);
    root.add(child2);

    const values = root.values().toArray();

    expect(root.size).toBe(2);
    expect(values[0].value).toBe('child1');
    expect(values[1].value).toBe('child2');
  });

  it('Проверка родительского узла', () => {
    const root = new TreeNode('root');
    const child = new TreeNode('child');

    root.add(child);

    expect(child.parent).toBe(root);
  });
});
