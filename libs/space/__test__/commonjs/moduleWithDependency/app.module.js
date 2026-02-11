const { AppServices } = require('./app.services');

class AppModule {
  static providers = [AppServices];
}

exports.AppModule = AppModule;
