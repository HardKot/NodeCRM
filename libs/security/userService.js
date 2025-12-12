class UserService {
  #secret;

  constructor(options = {}) {
    this.#secret = options.secret;
    this.password = {
      abc: options.passwordAbc ?? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      length: options.passwordLength ?? 8,
      symbols: options.passwordSymbols ?? '!@#$%^&*()_+[]{}|;:,.<>?',
      numbers: options.passwordNumbers ?? '0123456789',
    };

    Object.freeze(this);
  }

  async getUserByLogin() {
    throw new Error('Method not implemented.');
  }

  async createUser() {
    throw new Error('Method not implemented.');
  }

  async validatePassword(password) {
    const passwordRules = this.password;

    let isValid = true;

    if (!!passwordRules.length && password.length < passwordRules.length) isValid = false;
  }

  async generatePassword() {
    let password = '';
    const abc = this.password.abc + this.password.numbers + this.password.symbols;

    for (let i = 0; i < this.password.length; i++) {
      const index = Math.floor(Math.random() * abc);
      password += this.password[index];
    }
    return password;
  }
}

export { UserService };
