export class CoreError extends Error { }

export class BeanError extends Error { }

export class TypeError extends Error { }

export class FieldError extends Error { }

export class SourceParserError extends Error { }

export class ValidateError extends CoreError {
  errors: Record<string, string[]> = {};

  constructor(message: string, field = '*') {
    super(`Validation error on field "${field}": ${message}`);
    this.errors = {
      [field]: [message],
    };
  }
  addError(error: Error, field: string) {
    if (error instanceof ValidateError) {
      for (const key in error.errors) {
        const messages = error.errors[key].filter((it) => !!it);
        if (!messages.length) continue;
        let path = key;
        if (key === '*') {
          path = field;
        } else {
          path = `${field}.${key}`;
        }
        if (!this.errors[path]) this.errors[path] = [];
        this.errors[path] = this.errors[path].concat(messages);
      }
    } else {
      if (!this.errors[field]) this.errors[field] = [];
      this.errors[field].push(error.message || String(error));
    }
  }
}
