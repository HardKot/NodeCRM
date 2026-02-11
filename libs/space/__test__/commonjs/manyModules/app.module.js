const { TestModule } = require('./test.module');

class AppModule {
  static providers = [];
  static imports = [TestModule];
}

exports.AppModule = AppModule;
