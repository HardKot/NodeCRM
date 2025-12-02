export function runChains(chains, ...args) {
  return new Promise((resolve, reject) => {
    function next(index) {
      const runner = this.middlewares[index] ?? resolve;
      runner.apply(this, [...args, () => next(index + 1)]);
    }
    try {
      next.call(this, 0);
    } catch (e) {
      reject(e);
    }
  });
}
