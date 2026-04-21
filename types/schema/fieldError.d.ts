declare class FieldError extends Error {
}
declare class ValidateError extends FieldError {
    errors: Record<string, string[]>;
    constructor(message: string, field?: string);
    addError(error: Error, field: string): void;
}
export { ValidateError, FieldError };
