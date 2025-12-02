class CheckResult {
  #errors = [];
  #isValid;

  constructor(valid = true, errors = []) {
    if (!Array.isArray(errors)) {
      errors = [errors];
    }

    for (const error of errors) {
      if (typeof error === 'object') {
        this.#errors.push(error);
      } else {
        this.#errors.push({ path: '', message: error });
      }
    }

    this.#isValid = valid;
  }

  addError(message, path = '') {
    this.#isValid = false;
    if (message instanceof CheckResult) {
      for (const error of message.errors) {
        let name = `${path}`;
        if (error.path) name += `.${error.path}`;
        this.#errors.push({ path: path, message: error.message });
      }
      return this;
    }
    this.#errors.push({ path, message });
    return this;
  }

  get valid() {
    return this.#isValid;
  }

  get errors() {
    return Array.from(this.#errors);
  }

  static Falsy = new CheckResult(false);
  static Truthy = new CheckResult(true);
}

export { CheckResult };
