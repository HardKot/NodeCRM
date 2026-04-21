import { Optional } from '../utils';
class MetadataError extends Error {
}
class Metadata extends Map {
    static from(entries) {
        if (Symbol.iterator in entries) {
            return new Metadata(entries);
        }
        return new Metadata(Object.entries(entries));
    }
    get(key) {
        return Optional.ofNullable(super.get(key));
    }
    set(key, value) {
        return super.set(key, value);
    }
    getSubcomponent(subKey) {
        return new Metadata();
    }
    static KEY = '__metadata__';
    static Link(target, keyOrTable, value) {
        if (target === null || target === undefined)
            throw new MetadataError(`Cannot link metadata to null or undefined target`);
        if (!target[Metadata.KEY])
            target[Metadata.KEY] = {};
        if (typeof keyOrTable === 'object') {
            for (const [key, val] of Object.entries(keyOrTable))
                target[Metadata.KEY][key] = val;
        }
        else {
            target[Metadata.KEY][keyOrTable] = value;
        }
    }
}
export { Metadata };
