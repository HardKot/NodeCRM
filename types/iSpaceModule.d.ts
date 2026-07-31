declare interface ISpaceModule {
  readonly name: string;
  readonly description: string;
  readonly version?: string;
  entypoint?: () => void;
  prepare?: () => OptionalPromise;
  build?: () => OptionalPromise;
  run?: () => OptionalPromise;
}
