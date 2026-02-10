abstract class Space {
  abstract get(): Promise<any>;
  abstract build(): Promise<void>;
}

export { Space };
