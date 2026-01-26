class FieldError extends Error {}

class ValidateError extends FieldError {
  constructor(message, field = '*') {
    super(`Validation error on field "${field}": ${message}`);

    this.errors = {
      [field]: [message],
    };
  }

  addError(error, field) {
    if (error instanceof ValidateError) {
      for (const key in error.errors) {
        const messages = error.errors[key].filter(it => !!it);
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

module.exports = { ValidateError, FieldError };
