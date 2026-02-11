const { TestBModule } = require('./testB.module');
const { TestAModule } = require('./testA.module');

class AppModule {
  static providers = [];
  static imports = [TestBModule, TestAModule];
}

exports.AppModule = AppModule;
