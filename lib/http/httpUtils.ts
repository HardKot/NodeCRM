import { HttpMethod } from '#constant';
import { Types } from '#utils';
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

  static parseBody<T>(contentType: string, body: Buffer, options: { mimeTypes?: string[] } = {}): T {
    if (contentType.includes('application/json')) return JSON.parse(body.toString()) as T;
    if (contentType.includes('application/octet-stream') || options.mimeTypes?.some((it) => contentType.includes(it)))
      return body as unknown as T;
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(body.toString());
      return Object.fromEntries(params.entries()) as unknown as T;
    }
    if (contentType.includes('multipart/form-data')) {
      const boundary = '--' + contentType.split('boundary=')[1];

      return body
        .toString()
        .split(boundary)
        .filter((part) => part.trim() && part.trim() !== '--')
        .map(
          (
            it
          ):
            | { type: 'field'; name: string; value: string }
            | { type: 'file'; name: string; filename: string; contentType?: string; value: Buffer }
            | null => {
            const headerEndIndex = it.indexOf('\r\n\r\n');
            if (headerEndIndex === -1) return null;
            const headers = it.slice(0, headerEndIndex).trim();
            const body = it.slice(headerEndIndex + 4, it.length - 2);

            const contentDisposition = headers.match(
              /Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/i
            );
            if (!contentDisposition) return null;
            const fieldName = contentDisposition[1];
            const fileName = contentDisposition[2];

            if (!fileName) {
              return { type: 'field', name: fieldName, value: body };
            }

            const contentTypeMatch = headers.match(/Content-Type: ([^;]+)/i);
            return {
              type: 'file',
              name: fieldName,
              filename: fileName,
              contentType: contentTypeMatch?.[1],
              value: Buffer.from(body),
            };
          }
        )
        .reduce(
          (acc, part) => {
            if (!part) return acc;
            if (Types.isObject(acc)) {
              acc[part.name] = part.value;
              if (part.type === 'file') {
                acc[`__file__${part.name}`] = {
                  filename: part.filename,
                  contentType: part.contentType,
                };
              }
            }
            return acc;
          },
          {} as Record<string, string | Buffer> &
          Record<`__file__${string}`, { filename: string; contentType?: string }>
        ) as T;
    }
    if (contentType.includes('text/plain')) return body.toString() as unknown as T;

    return body as unknown as T;
  }
}
