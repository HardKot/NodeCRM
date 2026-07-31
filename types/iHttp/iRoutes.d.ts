declare type IHttpCommand = (command: IHttpHandlerDescription) => OptionalPromise;

declare interface RouteHandler {
  command: IHttpCommand;
  mapping: string;
  httpMethod: IHttpMethodValue;
}

declare interface IRoutes {
  find: (mapping: string, httpMethod: IHttpMethodKey) => RouteHandler | null;
  add: (...handlers: RouteHandler[]) => void;
}
