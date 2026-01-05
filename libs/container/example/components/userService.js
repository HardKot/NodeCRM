class UserService {
  static tag = 'Service';
  static inject = ['userRepository'];

  constructor(reps) {
    this.getData = reps.getData.bind(reps);
  }

  getById(id) {
    return this.getData().find(it => it.id === id);
  }
}

export { UserService };
