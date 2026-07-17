declare interface CreateHttpProps {
  tls: { key: string; cert: string } | null;
  http2: boolean;
  http1: boolean;
  requestTimeout: number;
  maxBodySize: number;
  requestPoolSize: number;
  port: number;
  host: string;

  onBusy?: IHandler;
  onNotFound?: IHandler;
  onError?: (err: Error, command: IHttpHandlerDescription) => void | Promise<void>;
}
