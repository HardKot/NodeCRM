declare type OptionalStingArray = string | string[] | undefined;

declare interface IHttpHandlerDescription {
  readBody<T>(): Promise<T>;
  readMethod(): IHttpMethodKey;
  readUrl(): string | undefined;
  readHost(): string | undefined;
  readIp(): string;
  readProtocol(): string;
  readContentType(): string | undefined;
  readPath(): string;
  readParam(name): OptionalStingArray;
  readHeader(name: string): OptionalStingArray;
  readCookie(name: string): OptionalStingArray;

  getId(): string;
  body<T>(body: T): void;
  statusCode(code: number): void;
  header(name: string, value: string | string[]): void;
  cookie(name: string, value: string): void;
  contentType(type: string): void;

  redirect(url: string): Promise<void>;
  send(): Promise<void>;

  json<T>(body: T): void;
  message(message: string): void;
  stream<T extends NodeJS.Writable | NodeJS.WritableStream>(v: T, type?: string): void;
  binary(v: Blob | Buffer, type?: string): void;
}
