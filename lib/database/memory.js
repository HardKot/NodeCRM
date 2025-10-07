import chalk from 'chalk';

export class Database {
  constructor() {
    // Хранилище данных в памяти для демонстрации
    this.clients = [];
    this.leads = [];
    this.tasks = [];
    this.activities = [];
    this.nextId = 1;

    this.init();
  }

  async init() {
    try {
      // Добавляем тестовые данные для демонстрации
      await this.seedTestData();
      console.log(chalk.green('✅ База данных (в памяти) инициализирована'));
    } catch (error) {
      console.error(chalk.red('❌ Ошибка инициализации БД:'), error);
    }
  }

  async seedTestData() {
    // Тестовые клиенты
    this.clients = [
      {
        id: 1,
        name: 'Иван Иванов',
        email: 'ivan@example.com',
        phone: '+7 (999) 123-45-67',
        company: 'ООО "Рога и копыта"',
        status: 'active',
        notes: 'Важный клиент',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Мария Петрова',
        email: 'maria@example.com',
        phone: '+7 (999) 765-43-21',
        company: 'ИП Петрова',
        status: 'active',
        notes: '',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Тестовые лиды
    this.leads = [
      {
        id: 1,
        name: 'Алексей Сидоров',
        email: 'alex@example.com',
        phone: '+7 (999) 111-22-33',
        company: 'ООО "Новая компания"',
        source: 'Сайт',
        status: 'new',
        value: 100000,
        probability: 50,
        notes: 'Потенциальный клиент',
        assigned_to: 'Менеджер',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Тестовые задачи
    this.tasks = [
      {
        id: 1,
        title: 'Связаться с клиентом',
        description: 'Обсудить новый проект',
        status: 'pending',
        priority: 'high',
        assigned_to: 'Менеджер',
        client_id: 1,
        lead_id: null,
        due_date: new Date(Date.now() + 86400000), // завтра
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Тестовые активности
    this.activities = [
      {
        id: 1,
        type: 'client_created',
        description: 'Создан новый клиент: Иван Иванов',
        entity_type: 'client',
        entity_id: 1,
        user_name: 'System',
        created_at: new Date(),
      },
    ];

    this.nextId = 3;
  }

  // Методы для работы с клиентами
  async getClients(limit = 20, offset = 0) {
    return this.clients.slice(offset, offset + limit);
  }

  async getClientsCount() {
    return this.clients.length;
  }

  async getClientById(id) {
    return this.clients.find(client => client.id === parseInt(id));
  }

  async createClient(clientData) {
    const client = {
      id: this.nextId++,
      ...clientData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.clients.push(client);
    await this.logActivity(
      'client_created',
      `Создан новый клиент: ${client.name}`,
      'client',
      client.id
    );

    return client;
  }

  async updateClient(id, clientData) {
    const index = this.clients.findIndex(client => client.id === parseInt(id));
    if (index === -1) throw new Error('Клиент не найден');

    this.clients[index] = {
      ...this.clients[index],
      ...clientData,
      updated_at: new Date(),
    };

    await this.logActivity(
      'client_updated',
      `Обновлен клиент: ${this.clients[index].name}`,
      'client',
      id
    );

    return this.clients[index];
  }

  async deleteClient(id) {
    const index = this.clients.findIndex(client => client.id === parseInt(id));
    if (index === -1) throw new Error('Клиент не найден');

    const client = this.clients[index];
    this.clients.splice(index, 1);

    await this.logActivity('client_deleted', `Удален клиент: ${client.name}`, 'client', id);

    return true;
  }

  // Методы для работы с лидами
  async getLeads(limit = 20, offset = 0) {
    return this.leads.slice(offset, offset + limit);
  }

  async createLead(leadData) {
    const lead = {
      id: this.nextId++,
      ...leadData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.leads.push(lead);
    await this.logActivity('lead_created', `Создан новый лид: ${lead.name}`, 'lead', lead.id);

    return lead;
  }

  // Методы для работы с задачами
  async getTasks(limit = 20, offset = 0) {
    const tasks = this.tasks.slice(offset, offset + limit);

    // Добавляем имена клиентов и лидов
    return tasks.map(task => {
      const client = task.client_id ? this.clients.find(c => c.id === task.client_id) : null;
      const lead = task.lead_id ? this.leads.find(l => l.id === task.lead_id) : null;

      return {
        ...task,
        client_name: client ? client.name : null,
        lead_name: lead ? lead.name : null,
      };
    });
  }

  async createTask(taskData) {
    const task = {
      id: this.nextId++,
      ...taskData,
      client_id: taskData.client_id ? parseInt(taskData.client_id) : null,
      lead_id: taskData.lead_id ? parseInt(taskData.lead_id) : null,
      due_date: taskData.due_date ? new Date(taskData.due_date) : null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.tasks.push(task);
    await this.logActivity('task_created', `Создана новая задача: ${task.title}`, 'task', task.id);

    return task;
  }

  // Методы для получения статистики
  async getDashboardStats() {
    const stats = {};

    // Количество активных клиентов
    stats.clients = this.clients.filter(client => client.status === 'active').length;

    // Количество активных лидов
    stats.leads = this.leads.filter(lead => ['new', 'contacted'].includes(lead.status)).length;

    // Количество активных задач
    stats.tasks = this.tasks.filter(task =>
      ['pending', 'in_progress'].includes(task.status)
    ).length;

    // Потенциальная выручка от лидов
    stats.revenue = this.leads
      .filter(lead => ['new', 'contacted'].includes(lead.status))
      .reduce((sum, lead) => sum + (parseFloat(lead.value) || 0), 0);

    return stats;
  }

  async getRecentActivities(limit = 10) {
    return this.activities
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  // Логирование активности
  async logActivity(type, description, entityType = null, entityId = null, userName = 'System') {
    const activity = {
      id: this.nextId++,
      type,
      description,
      entity_type: entityType,
      entity_id: entityId,
      user_name: userName,
      created_at: new Date(),
    };

    this.activities.push(activity);
  }

  // Закрытие соединения (заглушка для совместимости)
  async close() {
    console.log(chalk.yellow('📝 Закрытие подключения к базе данных (в памяти)'));
  }
}
