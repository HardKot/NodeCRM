declare type RouteHandler = {
  (command: IHttpHandlerDescription): Promise<void>;
  mapping: string;
  httpMethod: IHttpMethodValue;
};

declare interface IRoutes {
  find: (mapping: string, httpMethod: IHttpMethodKey) => RouteHandler | null;
  add: (...handlers: RouteHandler[]) => void;
}
