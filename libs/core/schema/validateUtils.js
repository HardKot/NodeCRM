const Validate = {
  int(value) {
    return Number.isInteger(value);
  },
  float(value) {
    return !Number.isInteger(value);
  },
  positive(value) {
    return value > 0;
  },
  negative(value) {
    return value < 0;
  },
  required(value) {
    if (typeof value === 'string') {
      return value.length > 0;
    }

    return typeof value !== 'undefined' && value !== null;
  },
  min(value, min) {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length > min;
    }

    return value > min;
  },
  max(value, max) {
    if (typeof value === 'string' || Array.isArray(value)) {
      return max > value.length;
    }

    return max > value;
  },
  match(value, regexp) {
    if (typeof regexp === 'string') {
      return regexp.test(new RegExp(value));
    }

    if (regexp instanceof RegExp) {
      return regexp.test(value);
    }

    return false;
  },
  isEnum(value, _enum) {
    return _enum.indexOf(value) !== -1;
  },
  url(value) {
    const regex =
      /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/;
    return regex.test(value);
  },
  email(value) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(value);
  },
  uuid(value) {
    const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(value);
  },
  lowercase(value) {
    return value.toLowerCase() === value;
  },
  uppercase(value) {
    return value.toUpperCase() === value;
  },
  after(value, after = null) {
    if (after === null) after = new Date();

    return after.getTime() > value.getTime();
  },
  before(value, before = null) {
    if (before === null) before = new Date();

    return value.getTime() > before.getTime();
  },
  fnTest(value, fn) {
    return fn(value);
  },
};

export { Validate };
