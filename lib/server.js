import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { crmLoggers, LogUtils } from './logger/crm-loggers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class CRMServer {
  constructor(options = {}) {
    this.port = options.port || process.env.PORT || 3000;
    this.routesDir = options.routesDir || join(__dirname, '..', 'routes');
    this.publicDir = options.publicDir || join(__dirname, '..', 'public');
    this.middlewares = [];
    this.staticRoutes = new Map();

    // Получаем логгер для сервера
    this.logger = crmLoggers.server;
  }

  // Middleware для логирования запросов
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // Обработка статических файлов
  async serveStatic(req, res, filePath) {
    try {
      const fullPath = join(this.publicDir, filePath);
      const stats = await stat(fullPath);

      if (stats.isFile()) {
        const content = await readFile(fullPath);
        const ext = extname(filePath);
        const contentType = this.getContentType(ext);

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);

        // Логируем обслуживание статических файлов только в debug режиме
        this.logger.debug('Static file served', {
          path: filePath,
          size: stats.size,
          contentType,
        });

        return true;
      }
    } catch (error) {
      this.logger.debug('Static file not found', { path: filePath });
      return false;
    }
    return false;
  }

  // Определение MIME типов
  getContentType(ext) {
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };
    return types[ext] || 'text/plain';
  }

  // Файловый роутинг
  async handleFileRoute(req, res) {
    const correlationId = LogUtils.generateCorrelationId();
    const start = Date.now();

    const url = new URL(req.url, `http://localhost:${this.port}`);
    let pathname = url.pathname;

    // Если путь заканчивается на '/', добавляем 'index'
    if (pathname.endsWith('/')) {
      pathname += 'index';
    }

    // Убираем начальный слеш
    if (pathname.startsWith('/')) {
      pathname = pathname.substring(1);
    }

    // Если путь пустой, используем 'index'
    if (!pathname) {
      pathname = 'index';
    }

    const routePath = join(this.routesDir, `${pathname}.js`);

    try {
      // Проверяем существование файла маршрута
      await stat(routePath);

      this.logger.debug('Route found', {
        correlationId,
        route: pathname,
        method: req.method,
        routePath,
      });

      // Динамический импорт модуля маршрута
      const routeModule = await import(`file://${routePath}?t=${Date.now()}`);

      // Вызываем соответствующий обработчик
      const method = req.method.toLowerCase();
      if (typeof routeModule[method] === 'function') {
        await LogUtils.measureTime(
          () => routeModule[method](req, res),
          this.logger,
          `Route handler ${method.toUpperCase()} ${pathname}`
        );
      } else if (typeof routeModule.default === 'function') {
        await LogUtils.measureTime(
          () => routeModule.default(req, res),
          this.logger,
          `Default route handler ${pathname}`
        );
      } else {
        this.logger.warn('No handler found for route', {
          correlationId,
          route: pathname,
          method: req.method,
          availableMethods: Object.keys(routeModule),
        });
        this.send404(res);
      }

      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.debug('Route file not found', {
          correlationId,
          route: pathname,
          routePath,
        });
        return false; // Файл маршрута не найден
      }

      this.logger.error('Route execution error', {
        correlationId,
        route: pathname,
        method: req.method,
        error: LogUtils.formatError(error),
      });

      crmLoggers.error.error('Route handler error', {
        correlationId,
        route: pathname,
        error: LogUtils.formatError(error),
      });

      this.send500(res, error);
      return true;
    }
  }

  // Отправка JSON ответа
  sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  // Отправка 404 ошибки
  send404(res) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <title>404 - Страница не найдена</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>404 - Страница не найдена</h1>
          <p>Запрашиваемый ресурс не найден на сервере.</p>
          <a href="/">Вернуться на главную</a>
        </body>
      </html>
    `);
  }

  // Отправка 500 ошибки
  send500(res, error) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <title>500 - Внутренняя ошибка сервера</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
            pre { text-align: left; background: #f8f9fa; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>500 - Внутренняя ошибка сервера</h1>
          <p>Произошла ошибка при обработке запроса.</p>
          ${process.env.NODE_ENV === 'development' ? `<pre>${error.stack}</pre>` : ''}
          <a href="/">Вернуться на главную</a>
        </body>
      </html>
    `);
  }

  // Основной обработчик запросов
  async handleRequest(req, res) {
    const correlationId = LogUtils.generateCorrelationId();
    const start = Date.now();

    // Добавляем корреляционный ID к запросу
    req.correlationId = correlationId;

    try {
      // Логируем входящий запрос
      crmLoggers.api.info('Incoming request', {
        correlationId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        contentLength: req.headers['content-length'],
      });

      // Применяем middleware
      for (const middleware of this.middlewares) {
        await middleware(req, res);
      }

      const url = new URL(req.url, `http://localhost:${this.port}`);

      // Попытка обслужить статические файлы
      if (await this.serveStatic(req, res, url.pathname)) {
        const duration = Date.now() - start;
        crmLoggers.api.debug('Static file request completed', {
          correlationId,
          method: req.method,
          url: req.url,
          status: 200,
          duration: `${duration}ms`,
        });
        return;
      }

      // Попытка обработать файловый маршрут
      if (await this.handleFileRoute(req, res)) {
        const duration = Date.now() - start;
        crmLoggers.api.info('Route request completed', {
          correlationId,
          method: req.method,
          url: req.url,
          status: res.statusCode || 200,
          duration: `${duration}ms`,
        });
        return;
      }

      // Если ничего не найдено, отправляем 404
      this.send404(res);
      const duration = Date.now() - start;
      crmLoggers.api.warn('404 Not Found', {
        correlationId,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - start;

      this.logger.error('Request handling error', {
        correlationId,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        error: LogUtils.formatError(error),
      });

      crmLoggers.error.error('Unhandled request error', {
        correlationId,
        error: LogUtils.formatError(error),
      });

      if (!res.headersSent) {
        this.send500(res, error);
      }
    }
  }

  // Запуск сервера
  start() {
    const server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.on('error', error => {
      if (error.code === 'EADDRINUSE') {
        this.logger.fatal(`Port ${this.port} already in use`, {
          port: this.port,
          error: LogUtils.formatError(error),
        });

        crmLoggers.error.fatal('Server startup failed - port in use', {
          port: this.port,
        });

        console.error(chalk.red(`❌ Порт ${this.port} уже используется`));
        console.log(chalk.yellow('💡 Попробуйте изменить PORT в .env файле'));
        process.exit(1);
      } else {
        this.logger.fatal('Server error', {
          error: LogUtils.formatError(error),
        });

        crmLoggers.error.fatal('Critical server error', {
          error: LogUtils.formatError(error),
        });
      }
    });

    server.listen(this.port, () => {
      this.logger.info('CRM Server started successfully', {
        port: this.port,
        env: process.env.NODE_ENV || 'development',
        routesDir: this.routesDir,
        publicDir: this.publicDir,
      });

      console.log(chalk.green('🚀 NodeCRM Server запущен!'));
      console.log(chalk.blue(`📡 Слушает порт: ${this.port}`));
      console.log(chalk.yellow(`🌐 URL: http://localhost:${this.port}`));
      console.log(chalk.cyan('📊 Панель управления доступна'));
      console.log(chalk.magenta('📝 Логирование активно'));
      console.log(chalk.gray('---'));
    });

    // Обработка graceful shutdown
    process.on('SIGINT', () => {
      this.logger.warn('Shutdown signal received', {
        signal: 'SIGINT',
      });

      console.log(chalk.yellow('\n🛑 Получен сигнал завершения, останавливаем сервер...'));

      server.close(() => {
        this.logger.info('Server stopped gracefully');
        console.log(chalk.green('✅ Сервер остановлен'));
        process.exit(0);
      });
    });

    return server;
  }

  // Остановка сервера
  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}
