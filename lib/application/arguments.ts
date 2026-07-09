import { Enveriment } from '#constant';

export { Arguments };

class Arguments {
  name?: string;
  enveronment?: IConfigEnvironmentValue;
  run?: boolean;

  #envOption: (arg: string) => boolean;
  #nameOption: (arg: string) => boolean;
  #runOption: (arg: string) => boolean;

  constructor() {
    this.#envOption = this.#parseOption('--env=', (value) => {
      if (this.#isValidEnv(value)) this.enveronment = value;
    });
    this.#nameOption = this.#parseOption('--name=', (value) => {
      this.name = value;
    });
    this.#runOption = this.#parseOption('--run=', (value) => {
      this.run = value;
    });
  }

  parse() {
    for (const arg of process.argv) {
      this.#envOption(arg);
      this.#nameOption(arg);
      this.#runOption(arg);
    }
  }

  #isValidEnv(value: string): value is IConfigEnvironmentValue {
    return !!Enveriment(value as IConfigEnvironmentValue);
  }

  #parseOption(option: string, callback: (value: string) => void): (arg: string) => boolean {
    return (arg: string) => {
      if (arg.startsWith(option)) {
        callback(arg.split('=')[1]);
        return true;
      }
      return false;
    };
  }
}
