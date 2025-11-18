class CheckResult {
  #errors;
  #isValid;

  constructor(valid = true, errors = []) {
    this.#errors = errors;
    this.#isValid = valid;
  }

  addError(path, message) {
    if (message instanceof CheckResult) {
      for (const error of message.errors) {
        this.#errors.push({ path: path + error.path, message: error.message });
      }
      return this;
    }
    this.#errors.push({ path, message });
    return this;
  }

  get valid() {
    return this.#isValid && !this.#errors.length;
  }

  get errors() {
    return Array.from(this.#errors);
  }

  static Falsy = new CheckResult(false);
  static Truthy = new CheckResult(true);
  static Message(message) {
    return new CheckResult(false, [{ path: '', message }]);
  }
}

export { CheckResult };
