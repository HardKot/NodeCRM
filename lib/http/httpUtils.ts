import { URLSearchParams } from 'node:url';

export { HttpUtils };

class HttpUtils {
  constructor() {
    throw new Error('HttpUtils is a static class and cannot be instantiated');
  }

  parseParams(url: string, template?: string): Record<string, string[] | string> {
    const queryParams = this.#extractQueryParams(url);
    const pathParams = template ? this.#extactPathParams(url, template) : [];

    return Object.fromEntries([...queryParams, ...pathParams]);
  }

  flatten(params: Record<string, string[]>): Record<string, string | string[]> {
    const flattened: Record<string, string | string[]> = {};
    for (const key in params) {
      if (params[key].length === 1) {
        flattened[key] = params[key][0];
      } else {
        flattened[key] = params[key];
      }
    }
    return flattened;
  }

  #extractQueryParams(url: string): [string, string | string[]][] {
    const queryParams = new URLSearchParams(url.split('?').at(-1) ?? '');

    return queryParams
      .keys()
      .map((key) => [key, queryParams.getAll(key)] as [string, string[]])
      .filter(([key, value]) => key && value.length > 0 && !key.startsWith('_'))
      .map(([key, value]) => [key, key.endsWith('[]') ? value : value.at(-1)] as [string, string | string[]])
      .toArray();
  }

  #extactPathParams(url: string, template: string): [string, string][] {
    const pathParts = url.split('?')[0].split('/').filter(Boolean);

    return template
      .split('/')
      .filter(Boolean)
      .map((it, index) => [it, index] as [string, number])
      .filter(([part]) => part.startsWith('<') && part.endsWith('>'))
      .map(([part, index]) => [part.slice(1, -1), pathParts[index]] as [string, string]);
  }
}
