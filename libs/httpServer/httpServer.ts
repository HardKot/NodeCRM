import * as http2 from 'node:http2';

import { ExecCommand, IInstance, Plugin } from '../application';

import { Routes } from './routes';
import { Handle } from './handle';
import { HandleRequest } from './handleRequest';

import type {
  ContentType,
  HttpServerOptions,
  TLSOptions,
  Routing,
  TokenConfig,
  ISecurityGetaway,
  IHttpTokenService,
} from './types';
import { HttpSecurity } from './httpSecurity';
import { JwtService } from './jwtService';
import {
  HttpSecurityGetaway,
  HttpSecurityGetawayEmpty,
  SecurityRepositorySymbol,
} from './httpSecurityGetaway';
import { TokenRepositorySimpleComponent } from './tokenRepository';
import { Component, Metadata } from '../core';
import { Session } from '../security';

class HttpServer implements Plugin {
  public readonly name = 'HttpServer';
  public readonly components: Component<any, any>[] = [HttpSecurityGetaway, TokenRepositorySimpleComponent]

  static factory(options: HttpServerOptions) {
    return new HttpServer(
      options.tls,
      options.accessTokenConfig,
      options.refreshTokenConfig,
      options.port,
      options.host,
      options.timeout,
      options.maxSessions,
      options.bodyLimit,
      Array.isArray(options.contentType)
        ? options.contentType
        : [options.contentType ?? 'application/json']
    );
  }

  private activeSessions: Set<http2.ServerHttp2Session>;
  private handlers: Handle[] = [];
  private server: http2.Http2SecureServer;
  public readonly primaryContentTyp: ContentType;

  private routing: Routing = Routes.initialize();
  private runCommand: ExecCommand = () => Promise.reject();
  private handleRequest: HandleRequest;

  private readonly accessJwtService: JwtService;
  private readonly refreshJwtService: JwtService;

  private security: HttpSecurity;

  constructor(
    public readonly tls: TLSOptions,
    accessTokenConfig: TokenConfig,
    refreshTokenConfig: TokenConfig,
    public readonly port: number = 8443,
    public readonly host: string = '127.0.0.1',
    public readonly requestTimeout: number = 60_000,
    public readonly maxSessions: number = 1024,
    public readonly bodyLimit: number = 1024,
    public readonly contentType: ContentType[] = ['application/json']
  ) {
    this.primaryContentTyp = contentType[0] ?? 'application/json';

    this.server = this.constructorHttp2();
    this.activeSessions = new Set();
    this.routing = Routes.initialize();

    const { accessJwtService, refreshJwtService } = this.constructorJwtService(accessTokenConfig, refreshTokenConfig);
    this.accessJwtService = accessJwtService;
    this.refreshJwtService = refreshJwtService;


    this.security = new HttpSecurity(
      this.accessJwtService,
      this.refreshJwtService,
      HttpSecurityGetawayEmpty
    );

    this.handleRequest = new HandleRequest(
      this.routing,
      this.runCommand,
      this.contentType,
      this.bodyLimit,
      this.security
    );

    this.components.push(this.publicTokenService())
  }

  private constructorHttp2() {
    const server = http2.createSecureServer({
      allowHTTP1: true,
      key: this.tls.key,
      cert: this.tls.cert,
    });

    server.setTimeout(this.requestTimeout);

    server.on('request', (req, res) => this.handleRequest.onRequest(req, res));
    server.on('session', this.onSession.bind(this));

    return server;
  }
  private constructorJwtService(accessTokenConfig: TokenConfig, refreshTokenConfig: TokenConfig) {
      const accessJwtService = new JwtService(
        accessTokenConfig.secret,
        accessTokenConfig.alg ?? 'HS256',
        accessTokenConfig.expiresIn ?? 3600
      );

      const refreshJwtService = new JwtService(
        refreshTokenConfig.secret,
        refreshTokenConfig.alg ?? 'HS256',
        refreshTokenConfig.expiresIn ?? 7 * 24 * 3600
      );

      accessTokenConfig.secret = "";
      refreshTokenConfig.secret = "";

      return { accessJwtService, refreshJwtService };
  }

  private publicTokenService() {
    const self = this;
    return new Component<IHttpTokenService, object>(
      'HttpTokenService',
      () => ({
        generateToken(session: Session) {
          return self.security.generateTokens(session);
        },
        refreshToken(refreshToken: string) {
          return self.security.refreshToken(refreshToken);
        }
      }),
      Metadata.from({ })
    )
  }

  async init(instance: IInstance) {
    this.runCommand = instance.execute.bind(instance);
    this.handlers = instance.commandsList.map(cmd => Handle.fromCommand(cmd)).filter(it => !!it);
    this.routing = Routes.byHandlers(this.handlers);
    Object.freeze(this.handlers);

    const securityGetaway = await instance.getProvider<ISecurityGetaway>(SecurityRepositorySymbol);

    if (securityGetaway) {
      this.security = new HttpSecurity(
        this.accessJwtService,
        this.refreshJwtService,
        securityGetaway
      );
    }

    this.handleRequest = new HandleRequest(
      this.routing,
      this.runCommand,
      this.contentType,
      this.bodyLimit,
      this.security
    );


    this.server.listen(this.port);
  }

  onSession(session: http2.ServerHttp2Session) {
    if (this.activeSessions.size >= this.maxSessions) {
      session.close();
      return;
    }
    this.activeSessions.add(session);

    session.on('close', () => {
      this.activeSessions.delete(session);
    });
  }
}

export { HttpServer };
