export declare class Table<K, V> extends Map<K, V[]> {
    add(row: K, value: V): void;
    get(row: K): V[];
}
