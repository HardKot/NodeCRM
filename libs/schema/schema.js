import { BaseField } from './baseField.js';
import { Result, Types } from '../utils/index.js';
import { ValidateError } from './fieldError.js';
class Schema extends BaseField {
    schema;
    proto;
    constructor(schema, proto = null) {
        super(true, []);
        this.schema = schema;
        this.proto = proto;
        this.schema = schema;
        this.proto = proto;
    }
    typeValidate(value) {
        if (!Types.isRecord(value))
            return Result.failure(new ValidateError('Expected an object'));
        let hasError = false;
        const error = new ValidateError('');
        for (const [key, field] of Object.entries(this.schema)) {
            field.validate(value[key]).fold(() => { }, itemError => {
                hasError = true;
                error.addError(itemError, key);
            });
        }
        if (hasError)
            return Result.failure(error);
        return Result.success(null);
    }
    transform(value) {
        if (value === undefined)
            return undefined;
        try {
            if (Types.isString(value))
                value = JSON.parse(value);
            if (!Types.isRecord(value))
                return undefined;
            const transformed = {};
            for (const [key, field] of Object.entries(this.schema)) {
                transformed[key] = field.transform(value[key]);
            }
            if (this.proto)
                Object.setPrototypeOf(transformed, this.proto);
            return transformed;
        }
        catch (e) {
            return undefined;
        }
    }
}

export { Schema };