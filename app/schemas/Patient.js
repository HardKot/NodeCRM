export const schema = {
  id: { type: 'number', autoIncrement: true },
  firstname: { type: 'string' },
  lastname: { type: 'string' },
  birthdate: { type: 'date' },
};

export const primaryKey = 'id';
export const table = 'patients';

export const proto = {
  getFullName() {
    return `${this.firstname} ${this.lastname}`;
  },
};
