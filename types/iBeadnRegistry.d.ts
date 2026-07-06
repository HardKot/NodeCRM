
declare interface IBeanRegistry {
  add<T>(def: IBean<T>): void;
  getDef<T>(alias: string): IBean<T>;
  getAllDefs<T>(): readonly IBean<T>[];

  validate(): IResult<null>;
  binder(callback: { <T>(builder: IBeanBuilder<T>): Promise<void> }): Promise<void>;
}


