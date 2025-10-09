export const schema = {
  id: { type: 'number', autoIncrement: true },
  name: { type: 'string', required: true, unique: true },
  description: { type: 'string' },
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date', default: () => new Date() },

  rules: { set: 'string' },
};

export const primaryKey = 'id';
export const table = 'positions';

export const proto = {
  hasAccess(rule) {
    if (!this.rules) return false;
    return this.rules.has(rule);
  },
};
