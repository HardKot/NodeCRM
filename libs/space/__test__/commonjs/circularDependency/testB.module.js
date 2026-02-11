const { AppServices } = require('./app.services');
const { TestAModule } = require('./testA.module');

class TestBModule {
  static imports = [TestAModule];
  static providers = [AppServices];
}

exports.TestBModule = TestBModule;
