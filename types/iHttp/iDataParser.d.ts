interface DataParserOptions {
  boundary?: string;
  charset?: BufferEncoding;
}

declare interface IDataParser {
  [key: string]: <T extends object>(data: Buffer, options: DataParserOptions) => Promise<T>;
}
