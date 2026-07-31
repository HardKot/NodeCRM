declare interface CreateHttpProps {
  tls: { key: string; cert: string } | null;
  http2: boolean;
  http1: boolean;
  requestTimeout: number;
  maxBodySize: number;
  requestPoolSize: number;
  port: number;
  host: string;

  onNotFound?: (command: IHttpHandlerDescription) => OptionalPromise;
  onError?: (err: Error, command: IHttpHandlerDescription) => OptionalPromise;

  routing?: IRoutes;
  dataParser?: IDataParser;
  logger: ILogger;
}
