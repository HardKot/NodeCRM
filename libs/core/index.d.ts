export class ApplicationError extends Error {}
export class InstanceError extends Error {}
export class AccessError extends Error {}
export class CommandError extends Error {}
export class SchemaError extends Error {}
export class FieldError extends Error {}
export class ValidateError extends FieldError {}

class ApplicationBuilder {
  module(module: object): ApplicationBuilder;
  clusterCount(count: number): ApplicationBuilder;
  stdout(stream: NodeJS.WriteStream): ApplicationBuilder;
  stderr(stream: NodeJS.WriteStream): ApplicationBuilder;
  plugins(plugins: any[]): ApplicationBuilder;
  run(): Promise<void>;
}

export class Application {
  static build(): ApplicationBuilder;
  private constructor();

  async run(): Promise<void>;
  async master(): Promise<void>;
  async worker(): Promise<void>;
}
