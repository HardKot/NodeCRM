declare interface ICommandDescription {
  getScope(): string;
  setScope(id: string): void;
  bean<T>(alias: string): Promise<T>;
  node<T>(name: string): T | null;
  npm<T>(name: string): T | null;
  lib<T>(name: string): T | null;
  config<T>(key: string, defaultValue?: T): T;
  print: ApplicationPrint;
}
