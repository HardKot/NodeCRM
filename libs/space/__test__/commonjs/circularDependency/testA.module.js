const { TestBModule } = require('./testB.module');

class TestAModule {
  static imports = [TestBModule];
}

exports.TestAModule = TestAModule;
