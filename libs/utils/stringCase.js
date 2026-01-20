function parse(source) {
  return source.split(/[_\-.A-Z]/g);
}

function factoryCamelCase(...strings) {
  const value = strings
    .flatMap(it => parse(it))
    .map(it => it.toLowerCase())
    .map(it => `${it[0].toUpperCase()}${it.slice(1)}`)
    .join('');
  return `${value[0].toLowerCase()}${value.slice(1)}`;
}

module.exports = { factoryCamelCase };
