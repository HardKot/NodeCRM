export const schema = {
  id: { type: 'number', autoIncrement: true },
  firstname: { type: 'string', required: true },
  lastname: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  phone: { type: 'string', unique: true },
  position: 'Position',
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date', default: () => new Date() },
};

export const primaryKey = 'id';
export const table = 'staffs';

export const proto = {
  getFullName() {
    return `${this.firstname} ${this.lastname}`;
  },
};
