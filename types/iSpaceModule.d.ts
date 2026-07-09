declare interface ISpaceModule {
  name: string;
  description: string;
  version: string;
  entypoint?: () => void;
  prepare?: () => void;
  build?: () => Promise<void>;
  run?: () => Promise<void>;
}
