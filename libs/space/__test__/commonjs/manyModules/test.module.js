const { AppServices } = require('./app.services');

class TestModule {
  static providers = [AppServices];
}

exports.TestModule = TestModule;
