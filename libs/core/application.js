class ApplicationError extends Error {}

class Application {
  static build() {}

  static ApplicationConfig = {
    path: process.cwd(),
    clusterCount: 1,
    context: {},
  };
}

export { Application, ApplicationError };
