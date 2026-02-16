class StringUtils {
  constructor() {
    throw new Error('StringCase is a static class and cannot be instantiated.');
  }

  static factoryCamelCase(...strings: string[]): string {
    const value = strings
      .flatMap(it => this.parse(it))
      .map(it => it.toLowerCase())
      .map(it => `${it[0].toUpperCase()}${it.slice(1)}`)
      .map(it => it.trim())
      .join('');
    return `${value[0].toLowerCase()}${value.slice(1)}`;
  }

  static factoryPascalCase(...strings: string[]): string {
    return strings
      .flatMap(it => this.parse(it))
      .map(it => it.toLowerCase())
      .map(it => `${it[0].toUpperCase()}${it.slice(1)}`)
      .map(it => it.trim())
      .join('');
  }

  static parse(source: string): string[] {
    return source.split(/[_\-.]+|(?=[A-Z])/g).filter(Boolean);
  }
}

export { StringUtils };
