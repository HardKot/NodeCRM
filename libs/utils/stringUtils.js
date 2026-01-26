class StringUtils {
  constructor() {
    throw new Error('StringCase is a static class and cannot be instantiated.');
  }

  static factoryCamelCase(...strings) {
    const value = strings
      .flatMap(it => this.#parse(it))
      .map(it => it.toLowerCase())
      .map(it => `${it[0].toUpperCase()}${it.slice(1)}`)
      .join('');
    return `${value[0].toLowerCase()}${value.slice(1)}`;
  }

  static #parse(source) {
    return source.split(/[_\-.A-Z]/g);
  }
}

module.exports = { StringUtils };
