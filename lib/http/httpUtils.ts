import { HttpMethod } from '#constant';
import { URLSearchParams } from 'node:url';

export { HttpUtils };

class HttpUtils {
  constructor() {
    throw new Error('HttpUtils is a static class and cannot be instantiated');
  }

  static flatten(params: Record<string, string[]>): Record<string, string | string[]> {
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

  static extractQueryParams(url: string): Record<string, string | string[]> {
    const queryParams = new URLSearchParams(url.split('?').at(-1) ?? '');

    return Object.fromEntries(
      queryParams
        .keys()
        .map((key) => [key, queryParams.getAll(key)] as [string, string[]])
        .filter(([key, value]) => key && value.length > 0 && !key.startsWith('_'))
        .map(([key, value]) => [key, key.endsWith('[]') ? value : value.at(-1)] as [string, string | string[]])
    );
  }

  static extactPathParams(url: string, template: string): Record<string, string> {
    const pathParts = url.split('?')[0].split('/').filter(Boolean);

    return Object.fromEntries(
      template
        .split('/')
        .filter(Boolean)
        .map((it, index) => [it, index] as [string, number])
        .filter(([part]) => part.startsWith('<') && part.endsWith('>'))
        .map(([part, index]) => [part.slice(1, -1), pathParts[index]] as [string, string])
    );
  }

  static normalizeUrl(url: string): string {
    let [path, query] = url.split('?');
    if (path.endsWith('/')) path += '/index';
    if (!path.startsWith('/')) path = '/' + path;
    path = path.replace(/\/+/g, '/');
    return query ? `${path}?${query}` : path;
  }

  static normalizeMethodKey(method: string): IHttpMethodKey | 'UNKNOWN' {
    const upperMethod = method.toUpperCase();
    if (upperMethod in HttpMethod) return upperMethod as IHttpMethodKey;
    return 'UNKNOWN';
  }

  static parserCookies(cookieHeader: string | undefined): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;

    for (const cookie of cookieHeader.split(';')) {
      const [name, ...rest] = cookie.split('=');
      cookies[name.trim()] = rest.join('=').trim();
    }

    return cookies;
  }
}
