declare interface ISpaceModule {
  readonly name: string;
  readonly description: string;
  readonly version?: string;
  entypoint?: () => void;
  prepare?: () => void;
  build?: () => Promise<void>;
  run?: () => Promise<void>;
}
