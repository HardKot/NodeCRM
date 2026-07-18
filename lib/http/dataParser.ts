import { HttpError } from '#constant';
import { Types } from '#utils';

export { DataParser };

type MultipartPartFiles = {
  [key: `__file__${string}`]: { filename: string; contentType?: string };
};

const DataParser: IDataParser = {
  async ['application/json']<T extends object>(data: Buffer, options: DataParserOptions): Promise<T> {
    const jsonString = data.toString(options.charset ?? 'utf-8').trim();
    const json = JSON.parse(jsonString) as T;
    // @ts-expect-error: TypeScript does not allow checking for __proto__ or constructor properties, but we can check for them at runtime
    if (Types.isNotUndefined(json.__proto__) || Types.isNotUndefined(json.constructor)) {
      throw new HttpError('Invalid JSON data: __proto__ or constructor properties are not allowed', 400);
    }
    return json as T;
  },

  async ['application/x-www-form-urlencoded']<T extends object>(data: Buffer, options: DataParserOptions): Promise<T> {
    const formString = data.toString(options.charset ?? 'utf-8').trim();
    const params = new URLSearchParams(formString);
    if (params.has('__proto__') || params.has('constructor')) {
      throw new HttpError('Invalid form data: __proto__ or constructor properties are not allowed', 400);
    }

    return Object.entries(params.entries()) as T;
  },

  // @ts-expect-error: TypeScript does not allow checking for __proto__ or constructor properties, but we can check for them at runtime
  async ['text/plain'](data: Buffer, options: DataParserOptions): Promise<string> {
    return data.toString(options.charset ?? 'utf-8').trim();
  },

  // @ts-expect-error: TypeScript does not allow checking for __proto__ or constructor properties, but we can check for them at runtime
  async ['application/octet-stream'](data: Buffer, _: DataParserOptions): Promise<Buffer> {
    return data;
  },

  async ['multipart/form-data']<T extends object>(
    data: Buffer,
    options: DataParserOptions
  ): Promise<T & MultipartPartFiles> {
    if (!options.boundary) throw new HttpError('Boundary is required for multipart/form-data', 400);

    const bodyEntries = data
      .toString(options.charset ?? 'utf-8')
      .trim()
      .split(`--${options.boundary}`)
      .filter((part) => part.trim() && part.trim() !== '--')
      .map((it) => parseMultipartPart(it))
      .map((it) => {
        if (it?.type === 'field') return [[it.name, it.value]];
        if (it?.type === 'file')
          return [
            [it.name, it.value],
            [`__file__${it.name}`, { filename: it.filename, contentType: it.contentType }],
          ];
        return null;
      })
      .filter((it) => it !== null)
      .flat(1);
    return Object.fromEntries(bodyEntries) as T & MultipartPartFiles;
  },
};

function parseMultipartPart(
  part: string
):
  | { type: 'field'; name: string; value: string }
  | { type: 'file'; name: string; filename: string; contentType?: string; value: Buffer }
  | null {
  const headerEndIndex = part.indexOf('\r\n\r\n');
  if (headerEndIndex === -1) return null;

  const headers = part.slice(0, headerEndIndex).trim();
  const body = part.slice(headerEndIndex + 4, part.length - 2);

  const contentDisposition = headers.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/i);

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
