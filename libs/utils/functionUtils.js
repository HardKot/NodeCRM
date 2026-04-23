class FunctionUtils {
    constructor() {
        throw new Error('FunctionUtils is a static class and cannot be instantiated.');
    }
    static curry(fn, ...preset) {
        return (...rest) => fn(...preset, ...rest);
    }
}

exports.FunctionUtils = FunctionUtils;