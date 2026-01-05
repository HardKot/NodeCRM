class UserRepository {
  static tag = 'Repository';
  static scope = 'Singleton';

  constructor() {
    this.values = [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ];
  }

  getValues() {
    return this.values.map(it => Object.freeze(it));
  }
}

export { UserRepository };
