import { SourceParser, Types } from '../utils';
import { EnumField } from './enumField';
import { ScalarField, ScalarType } from './scalarField';
import { UnknownField } from './fieldUnknown';
import { ArrayField } from './arrayField';
import { Schema } from './schema';
class SourceFieldParser extends SourceParser {
    parseString(source) {
        // TODO: support typescript interface parsing
        const required = !source.startsWith('?');
        let [type, ...tests] = source.split('|').map(v => v.trim());
        type = !required ? type.slice(1) : type;
        if (type.includes(',')) {
            return new EnumField(type.split(',').map(v => v.trim()), required);
        }
        const scalarType = this.extractScalarType(type.toLocaleString());
        if (!Types.isUndefined(scalarType))
            return new ScalarField(scalarType, required, tests.map(it => this.getTest(it)).filter((it) => it !== null));
        return new UnknownField();
    }
    parseObject(source) {
        if (this.isObjectFieldSource(source))
            return this.buildShameFields(source);
        const { required = false } = source;
        const scalarType = this.extractScalarType(source.type.toLowerCase());
        if (!Types.isUndefined(scalarType))
            return new ScalarField(scalarType, required, source.tests);
        return new UnknownField();
    }
    parseArray(source) {
        return new ArrayField(this.parse(source[0]), true);
    }
    buildShameFields(source) {
        const fieldsEntries = [];
        let proto = null;
        if (this.isSupportPrototype(source))
            proto = source['Prototype'];
        if (this.isSupportConstructor(source))
            proto = source['Constructor'].prototype;
        delete source['Prototype'];
        delete source['Constructor'];
        source = JSON.parse(JSON.stringify(source));
        for (const field in source)
            fieldsEntries.push([field, this.parse(source[field])]);
        return new Schema(Object.fromEntries(fieldsEntries), proto);
    }
    isObjectFieldSource(source) {
        const firstKey = Object.keys(source).at(0);
        return firstKey !== 'type';
    }
    extractScalarType(type) {
        const keys = Object.keys(ScalarType).map(it => it.toLowerCase());
        const index = keys.indexOf(type.toLowerCase());
        if (index === -1)
            return undefined;
        return ScalarType[Object.keys(ScalarType)[index]];
    }
    isSupportPrototype(source) {
        const firstKey = Object.keys(source).at(0);
        return firstKey === 'Prototype';
    }
    isSupportConstructor(source) {
        const firstKey = Object.keys(source).at(0);
        return firstKey === 'Constructor';
    }
    getTest(source) {
        return null;
    }
}
export { SourceFieldParser };
