export default class Result {
  constructor(result, error) {
    if (!!result && !Array.isArray(result)) result = [result];
    if (!!error && !Array.isArray(error)) error = [error];

    this.value = result ?? [];
    this.error = error ?? [];
  }

  hasError() {
    return this.error.length > 0;
  }

  getError(index = 0) {
    return this.error.at(index);
  }

  getValue(index = 0) {
    return this.value.at(index);
  }

  map(left, right) {
    this.value = this.value.map(left);
    this.error = this.error.map(right);
    return this;
  }

  filter(left, right) {
    this.value = this.value.filter(left);
    this.error = this.error.filter(right);
    return this;
  }

  flat(left, right) {
    this.value = this.value.flatMap(left);
    this.error = this.error.flatMap(right);
    return this;
  }

  static of(value) {
    return new Result(value, null);
  }

  static Reject(error) {
    return new Result([], error);
  }
}
