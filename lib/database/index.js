import pg from 'pg';
import chalk from 'chalk';
import { Database as MemoryDatabase } from './memory.js';
import { CRMDatabase } from './orm-database.js';

const { Pool } = pg;

export class Database {
  constructor() {
    // Проверяем, какую базу данных использовать
    this.usePostgreSQL = process.env.USE_POSTGRESQL !== 'false';
    this.useORM = process.env.USE_ORM !== 'false'; // по умолчанию используем ORM

    if (this.usePostgreSQL && this.useORM) {
      // Используем новую ORM
      this.ormDB = new CRMDatabase();
      return this.ormDB;
    } else if (this.usePostgreSQL) {
      // Используем старый способ с Pool
      this.pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'nodecrm',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
      });
      this.init();
    } else {
      // Используем версию в памяти
      this.memoryDB = new MemoryDatabase();
      return this.memoryDB;
    }
  }

  async init() {
    if (this.useORM) {
      return this.ormDB.init();
    }

    try {
      await this.createTables();
      console.log(chalk.green('✅ База данных PostgreSQL инициализирована'));
    } catch (error) {
      console.error(
        chalk.red('❌ Ошибка подключения к PostgreSQL, переключаемся на версию в памяти')
      );
      console.log(
        chalk.yellow(
          '💡 Для использования PostgreSQL установите и настройте его, затем установите USE_POSTGRESQL=true в .env'
        )
      );

      // Переключаемся на версию в памяти
      this.usePostgreSQL = false;
      this.memoryDB = new MemoryDatabase();
      return this.memoryDB;
    }
  }

  // Проксируем вызовы к соответствующей реализации
  async getClients(limit = 20, offset = 0) {
    if (this.useORM) return this.ormDB.getClients(limit, offset);
    if (!this.usePostgreSQL) return this.memoryDB.getClients(limit, offset);

    const query = `
      SELECT * FROM clients 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async getClientsCount() {
    if (this.useORM) return this.ormDB.getClientsCount();
    if (!this.usePostgreSQL) return this.memoryDB.getClientsCount();

    const result = await this.pool.query('SELECT COUNT(*) FROM clients');
    return parseInt(result.rows[0].count);
  }

  async getClientById(id) {
    if (this.useORM) return this.ormDB.getClientById(id);
    if (!this.usePostgreSQL) return this.memoryDB.getClientById(id);

    const result = await this.pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    return result.rows[0];
  }

  async createClient(clientData) {
    if (this.useORM) return this.ormDB.createClient(clientData);
    if (!this.usePostgreSQL) return this.memoryDB.createClient(clientData);

    const { name, email, phone, company, status = 'active', notes } = clientData;
    const query = `
      INSERT INTO clients (name, email, phone, company, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await this.pool.query(query, [name, email, phone, company, status, notes]);

    await this.logActivity(
      'client_created',
      `Создан новый клиент: ${name}`,
      'client',
      result.rows[0].id
    );

    return result.rows[0];
  }

  async updateClient(id, clientData) {
    if (this.useORM) return this.ormDB.updateClient(id, clientData);
    if (!this.usePostgreSQL) return this.memoryDB.updateClient(id, clientData);

    const { name, email, phone, company, status, notes } = clientData;
    const query = `
      UPDATE clients 
      SET name = $1, email = $2, phone = $3, company = $4, status = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    const result = await this.pool.query(query, [name, email, phone, company, status, notes, id]);

    await this.logActivity('client_updated', `Обновлен клиент: ${name}`, 'client', id);

    return result.rows[0];
  }

  async deleteClient(id) {
    if (this.useORM) return this.ormDB.deleteClient(id);
    if (!this.usePostgreSQL) return this.memoryDB.deleteClient(id);

    const client = await this.getClientById(id);
    await this.pool.query('DELETE FROM clients WHERE id = $1', [id]);

    await this.logActivity('client_deleted', `Удален клиент: ${client.name}`, 'client', id);

    return true;
  }

  async getLeads(limit = 20, offset = 0) {
    if (this.useORM) return this.ormDB.getLeads(limit, offset);
    if (!this.usePostgreSQL) return this.memoryDB.getLeads(limit, offset);

    const query = `
      SELECT * FROM leads 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async createLead(leadData) {
    if (this.useORM) return this.ormDB.createLead(leadData);
    if (!this.usePostgreSQL) return this.memoryDB.createLead(leadData);

    const {
      name,
      email,
      phone,
      company,
      source,
      status = 'new',
      value,
      probability = 0,
      notes,
      assigned_to,
    } = leadData;
    const query = `
      INSERT INTO leads (name, email, phone, company, source, status, value, probability, notes, assigned_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      name,
      email,
      phone,
      company,
      source,
      status,
      value,
      probability,
      notes,
      assigned_to,
    ]);

    await this.logActivity('lead_created', `Создан новый лид: ${name}`, 'lead', result.rows[0].id);

    return result.rows[0];
  }

  async getTasks(limit = 20, offset = 0) {
    if (this.useORM) return this.ormDB.getTasks(limit, offset);
    if (!this.usePostgreSQL) return this.memoryDB.getTasks(limit, offset);

    const query = `
      SELECT t.*, c.name as client_name, l.name as lead_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN leads l ON t.lead_id = l.id
      ORDER BY t.created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async createTask(taskData) {
    if (this.useORM) return this.ormDB.createTask(taskData);
    if (!this.usePostgreSQL) return this.memoryDB.createTask(taskData);

    const {
      title,
      description,
      status = 'pending',
      priority = 'medium',
      assigned_to,
      client_id,
      lead_id,
      due_date,
    } = taskData;
    const query = `
      INSERT INTO tasks (title, description, status, priority, assigned_to, client_id, lead_id, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      title,
      description,
      status,
      priority,
      assigned_to,
      client_id,
      lead_id,
      due_date,
    ]);

    await this.logActivity(
      'task_created',
      `Создана новая задача: ${title}`,
      'task',
      result.rows[0].id
    );

    return result.rows[0];
  }

  async getDashboardStats() {
    if (this.useORM) return this.ormDB.getDashboardStats();
    if (!this.usePostgreSQL) return this.memoryDB.getDashboardStats();

    const stats = {};

    const clientsResult = await this.pool.query('SELECT COUNT(*) FROM clients WHERE status = $1', [
      'active',
    ]);
    stats.clients = parseInt(clientsResult.rows[0].count);

    const leadsResult = await this.pool.query(
      'SELECT COUNT(*) FROM leads WHERE status IN ($1, $2)',
      ['new', 'contacted']
    );
    stats.leads = parseInt(leadsResult.rows[0].count);

    const tasksResult = await this.pool.query(
      'SELECT COUNT(*) FROM tasks WHERE status IN ($1, $2)',
      ['pending', 'in_progress']
    );
    stats.tasks = parseInt(tasksResult.rows[0].count);

    const revenueResult = await this.pool.query(
      'SELECT SUM(value) FROM leads WHERE status IN ($1, $2)',
      ['new', 'contacted']
    );
    stats.revenue = parseFloat(revenueResult.rows[0].sum) || 0;

    return stats;
  }

  async getRecentActivities(limit = 10) {
    if (this.useORM) return this.ormDB.getRecentActivities(limit);
    if (!this.usePostgreSQL) return this.memoryDB.getRecentActivities(limit);

    const query = `
      SELECT * FROM activities 
      ORDER BY created_at DESC 
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  async logActivity(type, description, entityType = null, entityId = null, userName = 'System') {
    if (this.useORM) {
      // ORM сама управляет активностями
      return;
    }
    if (!this.usePostgreSQL)
      return this.memoryDB.logActivity(type, description, entityType, entityId, userName);

    const query = `
      INSERT INTO activities (type, description, entity_type, entity_id, user_name)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await this.pool.query(query, [type, description, entityType, entityId, userName]);
  }

  // Методы для старой PostgreSQL реализации
  async createTables() {
    const queries = [
      // Таблица клиентов
      `CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Таблица лидов
      `CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'new',
        value DECIMAL(10,2),
        probability INTEGER DEFAULT 0,
        notes TEXT,
        assigned_to VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Таблица задач
      `CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'medium',
        assigned_to VARCHAR(255),
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Таблица активности
      `CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        user_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Индексы для производительности
      `CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email)`,
      `CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)`,
      `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
      `CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id)`,
    ];

    for (const query of queries) {
      await this.pool.query(query);
    }
  }

  async close() {
    if (this.useORM) return this.ormDB.close();
    if (!this.usePostgreSQL) return this.memoryDB.close();

    await this.pool.end();
  }
}
