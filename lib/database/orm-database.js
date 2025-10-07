import { ORM } from '../orm/index.js';
import chalk from 'chalk';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { crmLoggers, LogUtils } from '../logger/crm-loggers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class CRMDatabase {
  constructor() {
    // Инициализируем ORM с путем к схемам
    this.orm = new ORM({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'nodecrm',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
      maxConnections: 20,
      schemasPath: join(__dirname, '..', '..', 'schemas'), // путь к папке со схемами
    });

    // Модели будут загружены автоматически из схем
    this.Client = null;
    this.Lead = null;
    this.Task = null;
    this.Activity = null;
    this.User = null;

    // Логгер для базы данных
    this.logger = crmLoggers.database;
  }

  // Инициализация базы данных с автоматической загрузкой схем
  async init() {
    try {
      this.logger.info('Initializing CRM Database with schema auto-loading');

      // Подключаемся и загружаем схемы
      await LogUtils.measureTime(
        () => this.orm.connect(),
        this.logger,
        'ORM Connection and Schema Loading'
      );

      // Получаем ссылки на модели после загрузки схем
      this.Client = this.orm.getModel('client');
      this.Lead = this.orm.getModel('lead');
      this.Task = this.orm.getModel('task');
      this.Activity = this.orm.getModel('activity');
      this.User = this.orm.getModel('user');

      // Синхронизируем модели с базой данных
      await LogUtils.measureTime(
        () => this.orm.sync(),
        this.logger,
        'Database Schema Synchronization'
      );

      // Добавляем тестовые данные
      await this.seedTestData();

      // Выводим информацию о загруженных моделях
      this.printModelsInfo();

      this.logger.info('CRM Database initialized successfully', {
        models: Object.keys(this.orm.models),
        schemasPath: this.orm.schemaLoader.schemasPath,
      });

      console.log(
        chalk.green('✅ CRM База данных с автоматической загрузкой схем инициализирована')
      );
    } catch (error) {
      this.logger.error('Failed to initialize CRM Database', {
        error: LogUtils.formatError(error),
      });

      crmLoggers.error.error('Database initialization error', {
        error: LogUtils.formatError(error),
      });

      console.error(chalk.red('❌ Ошибка инициализации CRM БД:'), error);
      throw error;
    }
  }

  // Вывод информации о загруженных моделях
  printModelsInfo() {
    const modelsInfo = this.orm.getModelsInfo();
    console.log(chalk.cyan('\n📋 Информация о загруженных моделях:'));

    for (const [modelName, info] of Object.entries(modelsInfo)) {
      console.log(chalk.yellow(`  📊 ${modelName}:`));
      console.log(`    - Таблица: ${info.tableName}`);
      console.log(`    - Полей: ${info.fieldsCount}`);
      console.log(`    - Хуки: ${info.hasHooks ? '✅' : '❌'}`);
      console.log(`    - Валидация: ${info.hasValidations ? '✅' : '❌'}`);
      console.log(`    - Индексы: ${info.hasIndexes ? '✅' : '❌'}`);
    }
  }

  // Добавление тестовых данных с использованием расширенной функциональности
  async seedTestData() {
    try {
      // Проверяем, есть ли уже данные
      const clientsCount = await this.Client.count();
      if (clientsCount > 0) {
        console.log(chalk.yellow('📝 Тестовые данные уже существуют'));
        return;
      }

      // Используем транзакцию для добавления тестовых данных
      await this.orm.transaction(async transaction => {
        console.log(chalk.cyan('🌱 Добавляем тестовые данные...'));

        // Создаем тестовых клиентов (с автоматической валидацией и хуками)
        const client1 = await this.Client.create(
          {
            name: 'Иван Иванов',
            email: 'ivan@example.com',
            phone: '+7 (999) 123-45-67',
            company: 'ООО "Рога и копыта"',
            status: 'active',
            notes: 'Важный клиент',
          },
          transaction
        );

        const client2 = await this.Client.create(
          {
            name: 'Мария Петрова',
            email: 'maria@example.com',
            phone: '+7 (999) 765-43-21',
            company: 'ИП Петрова',
            status: 'active',
            notes: 'Постоянный клиент',
          },
          transaction
        );

        // Создаем тестовые лиды
        const lead1 = await this.Lead.create(
          {
            name: 'Алексей Сидоров',
            email: 'alex@example.com',
            phone: '+7 (999) 111-22-33',
            company: 'ООО "Новая компания"',
            source: 'Сайт',
            status: 'new',
            value: 100000,
            notes: 'Потенциальный клиент',
            assigned_to: 'Менеджер',
          },
          transaction
        );

        const lead2 = await this.Lead.create(
          {
            name: 'Елена Козлова',
            email: 'elena@example.com',
            phone: '+7 (999) 555-66-77',
            company: 'Стартап XYZ',
            source: 'Реклама',
            status: 'contacted',
            value: 250000,
            probability: 25,
            notes: 'Заинтересована в крупном контракте',
            assigned_to: 'Старший менеджер',
          },
          transaction
        );

        // Создаем тестовые задачи
        await this.Task.create(
          {
            title: 'Связаться с клиентом Иван Иванов',
            description: 'Обсудить новый проект и условия сотрудничества',
            status: 'pending',
            priority: 'high',
            assigned_to: 'Менеджер',
            client_id: client1.id,
            due_date: new Date(Date.now() + 86400000), // завтра
          },
          transaction
        );

        await this.Task.create(
          {
            title: 'Подготовить презентацию для лида',
            description: 'Создать коммерческое предложение для Алексея Сидорова',
            status: 'in_progress',
            priority: 'medium',
            assigned_to: 'Дизайнер',
            lead_id: lead1.id,
            due_date: new Date(Date.now() + 2 * 86400000), // послезавтра
          },
          transaction
        );

        // Создаем тестового пользователя
        await this.User.create(
          {
            username: 'manager1',
            email: 'manager@nodecrm.com',
            password_hash: '$2b$10$example.hash.here', // В реальности должен быть bcrypt хеш
            role: 'manager',
            first_name: 'Анна',
            last_name: 'Менеджерова',
            is_active: true,
          },
          transaction
        );

        console.log(chalk.green('✅ Тестовые данные успешно добавлены'));
      });
    } catch (error) {
      console.error(chalk.red('❌ Ошибка добавления тестовых данных:'), error);
    }
  }

  // Методы для работы с клиентами (используют расширенную функциональность схем)
  async getClients(limit = 20, offset = 0) {
    return await LogUtils.measureTime(
      () =>
        this.Client.find(
          {},
          {
            orderBy: 'created_at DESC',
            limit,
            offset,
          }
        ),
      this.logger,
      `Get clients (limit: ${limit}, offset: ${offset})`
    );
  }

  async getClientsCount() {
    return await LogUtils.measureTime(() => this.Client.count(), this.logger, 'Count clients');
  }

  async getClientById(id) {
    this.logger.debug('Getting client by ID', { clientId: id });

    const client = await this.Client.findById(id);

    if (client) {
      this.logger.debug('Client found', { clientId: id, clientName: client.name });
    } else {
      this.logger.warn('Client not found', { clientId: id });
    }

    return client;
  }

  async createClient(clientData) {
    const correlationId = LogUtils.generateCorrelationId();

    this.logger.info('Creating new client', {
      correlationId,
      clientData: LogUtils.sanitizeObject(clientData),
    });

    try {
      const client = await LogUtils.measureTime(
        () => this.Client.create(clientData),
        this.logger,
        'Client creation database operation'
      );

      // Логируем аудит действия
      crmLoggers.logUserAction('system', 'client_created', 'client', client.id, {
        clientName: client.name,
        email: client.email,
        correlationId,
      });

      this.logger.info('Client created successfully', {
        correlationId,
        clientId: client.id,
        clientName: client.name,
      });

      return client;
    } catch (error) {
      this.logger.error('Failed to create client', {
        correlationId,
        error: LogUtils.formatError(error),
        clientData: LogUtils.sanitizeObject(clientData),
      });

      crmLoggers.error.error('Client creation failed', {
        correlationId,
        error: LogUtils.formatError(error),
      });

      throw error;
    }
  }

  async updateClient(id, clientData) {
    const correlationId = LogUtils.generateCorrelationId();

    this.logger.info('Updating client', {
      correlationId,
      clientId: id,
      updateData: LogUtils.sanitizeObject(clientData),
    });

    try {
      const result = await LogUtils.measureTime(
        () => this.Client.update({ id }, clientData),
        this.logger,
        'Client update database operation'
      );

      const client = result[0];

      if (client) {
        crmLoggers.logUserAction('system', 'client_updated', 'client', id, {
          clientName: client.name,
          changes: Object.keys(clientData),
          correlationId,
        });

        this.logger.info('Client updated successfully', {
          correlationId,
          clientId: id,
          clientName: client.name,
        });
      }

      return client;
    } catch (error) {
      this.logger.error('Failed to update client', {
        correlationId,
        clientId: id,
        error: LogUtils.formatError(error),
      });

      throw error;
    }
  }

  async deleteClient(id) {
    const correlationId = LogUtils.generateCorrelationId();

    this.logger.warn('Deleting client', {
      correlationId,
      clientId: id,
    });

    try {
      // Сначала получаем информацию о клиенте для аудита
      const client = await this.Client.findById(id);

      if (!client) {
        this.logger.warn('Attempted to delete non-existent client', {
          correlationId,
          clientId: id,
        });
        return false;
      }

      const deleted = await LogUtils.measureTime(
        () => this.Client.delete({ id }),
        this.logger,
        'Client deletion database operation'
      );

      if (deleted.length > 0) {
        crmLoggers.logUserAction('system', 'client_deleted', 'client', id, {
          clientName: client.name,
          correlationId,
        });

        this.logger.warn('Client deleted successfully', {
          correlationId,
          clientId: id,
          clientName: client.name,
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to delete client', {
        correlationId,
        clientId: id,
        error: LogUtils.formatError(error),
      });

      crmLoggers.error.error('Client deletion failed', {
        correlationId,
        clientId: id,
        error: LogUtils.formatError(error),
      });

      throw error;
    }
  }

  // Методы для работы с лидами
  async getLeads(limit = 20, offset = 0) {
    return await LogUtils.measureTime(
      () =>
        this.Lead.find(
          {},
          {
            orderBy: 'created_at DESC',
            limit,
            offset,
          }
        ),
      this.logger,
      `Get leads (limit: ${limit}, offset: ${offset})`
    );
  }

  async createLead(leadData) {
    const correlationId = LogUtils.generateCorrelationId();

    this.logger.info('Creating new lead', {
      correlationId,
      leadData: LogUtils.sanitizeObject(leadData),
    });

    try {
      const lead = await LogUtils.measureTime(
        () => this.Lead.create(leadData),
        this.logger,
        'Lead creation database operation'
      );

      crmLoggers.logUserAction('system', 'lead_created', 'lead', lead.id, {
        leadName: lead.name,
        value: lead.value,
        correlationId,
      });

      this.logger.info('Lead created successfully', {
        correlationId,
        leadId: lead.id,
        leadName: lead.name,
        value: lead.value,
      });

      return lead;
    } catch (error) {
      this.logger.error('Failed to create lead', {
        correlationId,
        error: LogUtils.formatError(error),
      });

      throw error;
    }
  }

  // Методы для работы с задачами
  async getTasks(limit = 20, offset = 0) {
    // Используем JOIN запрос для получения связанных данных
    const query = `
      SELECT t.*, c.name as client_name, l.name as lead_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN leads l ON t.lead_id = l.id
      ORDER BY t.created_at DESC 
      LIMIT $1 OFFSET $2
    `;

    const result = await this.orm.query(query, [limit, offset]);
    return result.rows;
  }

  async createTask(taskData) {
    return await this.Task.create(taskData);
  }

  // Получение статистики с логированием производительности
  async getDashboardStats() {
    this.logger.debug('Calculating dashboard statistics');

    try {
      const stats = await LogUtils.measureTime(
        async () => {
          const [clients, leads, tasks, revenue] = await Promise.all([
            this.Client.count({ status: 'active' }),
            this.Lead.count({ status: 'new' }) + (await this.Lead.count({ status: 'contacted' })),
            this.Task.count({ status: 'pending' }) +
              (await this.Task.count({ status: 'in_progress' })),
            this.orm.query(`
            SELECT COALESCE(SUM(value), 0) as total 
            FROM leads 
            WHERE status IN ('new', 'contacted')
          `),
          ]);

          return {
            clients,
            leads,
            tasks,
            revenue: parseFloat(revenue.rows[0].total) || 0,
          };
        },
        crmLoggers.perf,
        'Dashboard statistics calculation'
      );

      this.logger.debug('Dashboard statistics calculated', stats);

      // Логируем метрики производительности
      crmLoggers.logPerformance('dashboard_stats_clients', stats.clients, 'count');
      crmLoggers.logPerformance('dashboard_stats_leads', stats.leads, 'count');
      crmLoggers.logPerformance('dashboard_stats_tasks', stats.tasks, 'count');
      crmLoggers.logPerformance('dashboard_stats_revenue', stats.revenue, 'rub');

      return stats;
    } catch (error) {
      this.logger.error('Failed to calculate dashboard statistics', {
        error: LogUtils.formatError(error),
      });

      throw error;
    }
  }

  async getRecentActivities(limit = 10) {
    return await this.Activity.find(
      {},
      {
        orderBy: 'created_at DESC',
        limit,
      }
    );
  }

  // Дополнительные методы для демонстрации возможностей схем

  // Поиск клиентов с валидацией
  async searchClients(searchTerm, filters = {}) {
    // Можно добавить сложную логику поиска
    const query = `
      SELECT * FROM clients 
      WHERE (name ILIKE $1 OR email ILIKE $1 OR company ILIKE $1)
      ${filters.status ? 'AND status = $2' : ''}
      ORDER BY created_at DESC
    `;

    const params = [`%${searchTerm}%`];
    if (filters.status) {
      params.push(filters.status);
    }

    const result = await this.orm.query(query, params);
    return result.rows;
  }

  // Конвертация лида в клиента с подробным логированием
  async convertLeadToClient(leadId, additionalData = {}) {
    const correlationId = LogUtils.generateCorrelationId();

    this.logger.info('Starting lead to client conversion', {
      correlationId,
      leadId,
      additionalData,
    });

    try {
      const result = await this.orm.transaction(async transaction => {
        // Получаем лид
        const lead = await this.Lead.findById(leadId, transaction);
        if (!lead) {
          throw new Error('Лид не найден');
        }

        this.logger.debug('Lead found for conversion', {
          correlationId,
          leadId,
          leadName: lead.name,
          leadValue: lead.value,
        });

        // Создаем клиента на основе лида
        const clientData = {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          status: 'active',
          notes: `Конвертирован из лида. ${lead.notes || ''}`,
          ...additionalData,
        };

        const client = await this.Client.create(clientData, transaction);

        // Обновляем статус лида
        await this.Lead.update({ id: leadId }, { status: 'won' }, transaction);

        // Логируем активность
        await this.Activity.create(
          {
            type: 'lead_converted',
            description: `Лид ${lead.name} конвертирован в клиента`,
            entity_type: 'client',
            entity_id: client.id,
            user_name: 'System',
            metadata: {
              lead_id: leadId,
              conversion_date: new Date(),
              correlationId,
            },
          },
          transaction
        );

        return { client, lead };
      });

      // Логируем успешную конвертацию
      crmLoggers.logUserAction('system', 'lead_converted', 'client', result.client.id, {
        leadId,
        leadName: result.lead.name,
        clientId: result.client.id,
        leadValue: result.lead.value,
        correlationId,
      });

      this.logger.info('Lead successfully converted to client', {
        correlationId,
        leadId,
        clientId: result.client.id,
        leadValue: result.lead.value,
      });

      // Логируем метрику конвертации
      crmLoggers.logPerformance('lead_conversion', 1, 'count', {
        leadValue: result.lead.value,
        correlationId,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to convert lead to client', {
        correlationId,
        leadId,
        error: LogUtils.formatError(error),
      });

      crmLoggers.error.error('Lead conversion failed', {
        correlationId,
        leadId,
        error: LogUtils.formatError(error),
      });

      throw error;
    }
  }

  // Горячая перезагрузка схемы (для разработки)
  async reloadSchema(schemaName) {
    await this.orm.reloadSchema(schemaName);

    // Обновляем ссылки на модели
    this.Client = this.orm.getModel('client');
    this.Lead = this.orm.getModel('lead');
    this.Task = this.orm.getModel('task');
    this.Activity = this.orm.getModel('activity');
    this.User = this.orm.getModel('user');

    console.log(chalk.green(`✅ Схема ${schemaName} перезагружена в CRM`));
  }

  // Закрытие соединений
  async close() {
    await this.orm.close();
  }
}
