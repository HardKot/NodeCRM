declare interface IHttpServer {
  routing: IRoutes;
  dataParser: IDataParser;
  commnadDescription: IHttpHandlerDescription;
  options: HttpOptions;
  plugins: IHttpServerPlugin[];

  run(): Promise<void>;
  stop(): Promise<void>;
  createCommandDescription(): IHttpHandlerDescription;
}
