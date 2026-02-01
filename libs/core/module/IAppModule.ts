export interface IAppModuleInit {
  onModuleInit(): Promise<void>;
}

export interface IAppModuleApplcationBootstrap {
  onApplicationBootstrap(): Promise<void>;
}

export interface IAppModuleDestroy {
  onModuleDestroy(): Promise<void>;
}

export interface IAppModuleApplicationShutdown {
  onApplicationShutdown(): Promise<void>;
}
