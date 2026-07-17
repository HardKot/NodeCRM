declare interface IHttpHandlerDescription {
  getId(): string;
  getBody<T>(): Promise<T>;
  getMethod(): IHttpMethodKey;
  getUrl(): string;
  getIp(): string;
  getProtocol(): string;
  getContentType(): string | undefined;
  getPath(): string;
  getParam(name): string | string[] | undefined;
  getHeader(name: string): string | string[] | undefined;
  getCookie(name: string): string | undefined;

  body(body: any): void;
  redirect(url: string): void;
  send(): void;
  statusCode(code: number): void;
  header(name: string, value: string | string[]): void;
  cookie(name: string, value: string): void;
  contentType(type: string): void;
}
