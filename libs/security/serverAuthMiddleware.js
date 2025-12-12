class ServerAuthMiddleware {
  constructor(jwtService, getScope, options = {}) {
    this.jwtService = jwtService;
    this.responsOnFailure = options.responseOnFailure;
    this.getScope = getScope;
  }

  byJwt(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader.startsWith('Bearer')) return next();
    const token = authHeader.split(' ')[1];

    if (!token) return next();

    if (!this.jwtService.verify(token)) {
      if (this.responsOnFailure) {
        return this.responsOnFailure(req, res);
      } else {
        return res.status(401).json({ message: 'Invalid token' }).send();
      }
    }

    const scope = this.getScope();
    scope.user = this.jwtService.decode(token);
    return next();
  }
}

export { ServerAuthMiddleware };
