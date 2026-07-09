declare interface ISpaceModule {
  name: string;
  description: string;
  version: string;
  entypoint?: () => void;
}
