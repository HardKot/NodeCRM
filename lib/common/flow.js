export class Flow {
  constructor(result) {
    if (!Array.isArray(result)) result = [result];

    this.value = Promise.all(result).then(it => {
      if (Array.isArray(it)) it = it.flat(1);
      return it;
    });
  }

  map(callback) {
    this.value = this.value.then(it => {
      // console.log(it.map(a => a));
      return Promise.all(it.map(callback));
    });
    return this;
  }

  filter(callback) {
    this.value = this.value.then(it => Promise.all(it.filter(callback)));
    return this;
  }

  reduce(callback, initialValue) {
    this.value = this.value
      .then(it => Promise.all([it.reduce(callback, initialValue)]))
      .then(it => it.flat());
    return this;
  }

  get() {
    return this.value;
  }

  then(callback) {
    this.value = this.value.then(callback);
    return this;
  }

  at(index) {
    this.value = this.value.then(it => it[index]);
    return this;
  }

  first() {
    this.value = this.value.then(it => it[0]);
    return this;
  }

  catch(callback) {
    this.value = this.value.catch(callback);
    return this;
  }

  finally(callback) {
    this.value = this.value.finally(callback);
    return this;
  }

  forEach(callback) {
    this.value = this.value.then(it => {
      it.forEach(callback);
      return it;
    });
    return this;
  }

  flat(index) {
    this.value = this.value.then(it => it.flat(index));
    return this;
  }

  concat(array) {
    this.value = this.value.then(it => it.concat(array));
    return this;
  }

  sort(compareFunction) {
    this.value = this.value.then(it => it.sort(compareFunction));
    return this;
  }

  toMap() {
    this.value = this.value.then(it => new Map(it));
    return this;
  }

  toObject() {
    this.value = this.value.then(it => Object.fromEntries(it));
    return this;
  }

  copy() {
    return new Flow(this.value);
  }

  static of(value) {
    return new Flow(value);
  }
}
