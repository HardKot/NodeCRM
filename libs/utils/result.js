const { Types } = require('./types');
class Result {
    value;
    isSuccess;
    isFailure;
    static of(value) {
        return new Result(value, true);
    }
    static success(value) {
        return new Result(value, true);
    }
    static failure(error) {
        return new Result(error, false);
    }
    static fromPromise(promise) {
        return promise
            .then(value => Result.success(value))
            .catch(error => Result.failure(error));
    }
    constructor(value, isSuccess = null) {
        this.value = value;
        if (Types.isBoolean(isSuccess)) {
            this.isSuccess = isSuccess;
            this.isFailure = !isSuccess;
        }
        else {
            this.isFailure = value instanceof Error;
            this.isSuccess = !this.isFailure;
        }
        Object.freeze(this);
    }
    getOrNull() {
        return this.isSuccess ? this.value : null;
    }
    getOrThrow() {
        if (this.isFailure)
            throw this.value;
        return this.value;
    }
    getOrElse(onFailure) {
        if (Types.isFunction(onFailure)) {
            return this.isSuccess ? this.value : onFailure(this.value);
        }
        return this.isSuccess ? this.value : onFailure;
    }
    errorOrNull() {
        return this.isFailure ? this.value : null;
    }
    fold(onSuccess, onFailure) {
        if (this.isSuccess) {
            return onSuccess(this.value);
        }
        return onFailure(this.value);
    }
    map(transform) {
        if (this.isSuccess) {
            try {
                const transformed = transform(this.value);
                return Result.success(transformed);
            }
            catch (error) {
                return Result.failure(error);
            }
        }
        return Result.failure(this.value);
    }
}

exports.Result = Result;