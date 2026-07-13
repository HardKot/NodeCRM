declare interface IHttpReply {
  getId(): string;
  getBody<T>(): Promise<T>;
  getMethod(): string;
  getUrl(): string;
  getIp(): string;
  getProtocol(): string;
  getContentType(): string | undefined;
  getParam(name): string | undefined;
  getHeader(name: string): string | string[] | undefined;
  getCookie(name: string): string | undefined;

  body(body: any): void;
  redirect(url: string): void;
  close(): void;
  statusCode(code: number): void;
  header(name: string, value: string | string[]): void;
  cookie(name: string, value: string): void;
  contentType(type: string): void;
}
