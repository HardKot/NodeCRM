declare interface HandlerOptions {
  authenticate?: 'jwt' | 'public' | 'private' | string;
}

declare interface IHandlerFunction {
  (path: string, command: IHttpCommand): void;
  (command: IHttpCommand): void;
}

declare interface IHttpRoutingDescriptionProps {
  get: IHandlerFunction;
  post: IHandlerFunction;
  put: IHandlerFunction;
  delete: IHandlerFunction;
  patch: IHandlerFunction;
  options: IHandlerFunction;
  head: IHandlerFunction;
  route: (path: string, callback: IHttpRoutingDescription) => void;
}

declare type IHttpRoutingDescription = (props: HttpRoutingDescriptionProps) => void;
