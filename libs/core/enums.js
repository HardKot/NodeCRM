const Scoped = Object.freeze({
  SINGLETON: 0,
  TRANSIENT: 1,
  SCOPED: 2,
});

const ApplicationEvent = Object.freeze({
  ERROR: 0,
  RUN: 1,
  STOP: 2,
  PREPARE: 3,
  BUILD: 4,
  MESSAGE: 5,
});

const ScalarType = Object.freeze({
  String: 0,
  Number: 1,
  Boolean: 2,
  Int: 3,
});

const ApplicationArgs = Object.freeze({
  RUNNER: 'runner',
});

export { Scoped, ApplicationEvent, ScalarType, ApplicationArgs };
