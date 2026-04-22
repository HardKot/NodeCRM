import * as http2 from 'node:http2';
import { Routes } from './routes';
import { Handle } from './handle';
import { HandleRequest } from './handleRequest';
import { HttpSecurity } from './httpSecurity';
import { JwtService } from './jwtService';
import { HttpSecurityGetaway, HttpSecurityGetawayEmpty, SecurityRepositorySymbol, } from './httpSecurityGetaway';
import { TokenRepositorySimpleComponent } from './tokenRepository';
import { Component } from '../core';
class HttpServer {
    tls;
    port;
    host;
    requestTimeout;
    maxSessions;
    bodyLimit;
    contentType;
    name = 'HttpServer';
    components = [HttpSecurityGetaway, TokenRepositorySimpleComponent];
    static factory(options) {
        return new HttpServer(options.tls, options.accessTokenConfig, options.refreshTokenConfig, options.port, options.host, options.timeout, options.maxSessions, options.bodyLimit, Array.isArray(options.contentType)
            ? options.contentType
            : [options.contentType ?? 'application/json']);
    }
    activeSessions;
    handlers = [];
    server;
    primaryContentTyp;
    routing = Routes.initialize();
    runCommand = () => Promise.reject();
    handleRequest;
    accessJwtService;
    refreshJwtService;
    security;
    constructor(tls, accessTokenConfig, refreshTokenConfig, port = 8443, host = '127.0.0.1', requestTimeout = 60_000, maxSessions = 1024, bodyLimit = 1024, contentType = ['application/json']) {
        this.tls = tls;
        this.port = port;
        this.host = host;
        this.requestTimeout = requestTimeout;
        this.maxSessions = maxSessions;
        this.bodyLimit = bodyLimit;
        this.contentType = contentType;
        this.primaryContentTyp = contentType[0] ?? 'application/json';
        this.server = this.constructorHttp2();
        this.activeSessions = new Set();
        this.routing = Routes.initialize();
        const { accessJwtService, refreshJwtService } = this.constructorJwtService(accessTokenConfig, refreshTokenConfig);
        this.accessJwtService = accessJwtService;
        this.refreshJwtService = refreshJwtService;
        this.security = new HttpSecurity(this.accessJwtService, this.refreshJwtService, HttpSecurityGetawayEmpty);
        this.handleRequest = new HandleRequest(this.routing, this.runCommand, this.contentType, this.bodyLimit, this.security);
        this.components.push(this.publicTokenService());
    }
    publicTokenService() {
        const self = this;
        return new Component('HttpTokenService', () => ({
            generateToken(session) {
                return self.security.generateTokens(session);
            },
            refreshToken(refreshToken) {
                return self.security.refreshToken(refreshToken);
            }
        }), {});
    }
    constructorHttp2() {
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
    constructorJwtService(accessTokenConfig, refreshTokenConfig) {
        const accessJwtService = new JwtService(accessTokenConfig.secret, accessTokenConfig.alg ?? 'HS256', accessTokenConfig.expiresIn ?? 3600);
        const refreshJwtService = new JwtService(refreshTokenConfig.secret, refreshTokenConfig.alg ?? 'HS256', refreshTokenConfig.expiresIn ?? 7 * 24 * 3600);
        accessTokenConfig.secret = "";
        refreshTokenConfig.secret = "";
        return { accessJwtService, refreshJwtService };
    }
    async init(instance) {
        this.runCommand = instance.execute.bind(instance);
        this.handlers = instance.commandsList.map(cmd => Handle.fromCommand(cmd)).filter(it => !!it);
        this.routing = Routes.byHandlers(this.handlers);
        Object.freeze(this.handlers);
        const securityGetaway = await instance.getProvider(SecurityRepositorySymbol);
        if (securityGetaway) {
            this.security = new HttpSecurity(this.accessJwtService, this.refreshJwtService, securityGetaway);
        }
        this.handleRequest = new HandleRequest(this.routing, this.runCommand, this.contentType, this.bodyLimit, this.security);
        this.server.listen(this.port);
    }
    onSession(session) {
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
