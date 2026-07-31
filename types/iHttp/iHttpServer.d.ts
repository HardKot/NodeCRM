declare interface IHttpServer {
  routing: IRoutes;
  dataParser: IDataParser;
  commnadDescription: IHttpHandlerDescription;
  options: HttpOptions;

  run(): Promise<void>;
  stop(): Promise<void>;
  createCommandDescription(): IHttpHandlerDescription;
}
