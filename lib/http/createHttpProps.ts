import { Routes } from './routes.ts';

export type IHandler = (command: IHttpHandlerDescription) => void | Promise<void>;

export interface CreateHttpProps {
  router: Routes;
  tls: { key: string; cert: string } | null;
  http2: boolean;
  http1: boolean;
  requestTimeout: number;
  maxBodySize: number;
  requestPoolSize: number;
  port: number;
  host: string;

  onRequest: IHandler;
  onBusy?: IHandler;
  onError?: (err: Error, command: IHttpHandlerDescription) => void | Promise<void>;
}
