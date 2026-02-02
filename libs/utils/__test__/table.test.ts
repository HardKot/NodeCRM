import { Table } from '../table';

describe('Table', () => {
  it('Добавление и получение значений', () => {
    const table = new Table<string, number>();
    table.add('row1', 1);
    table.add('row1', 2);
    table.add('row2', 3);

    expect(table.get('row1')).toEqual([1, 2]);
    expect(table.get('row2')).toEqual([3]);
    expect(table.get('row3')).toEqual([]);
  });
});
