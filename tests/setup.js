// Глобальные настройки для Jest тестов
import { jest } from '@jest/globals';

// Увеличиваем таймаут для тестов с базой данных
jest.setTimeout(10000);

// Мокаем консоль в тестах (опционально)
global.console = {
  ...console,
  // Отключаем логи в тестах для чистого вывода
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Глобальные моки для Node.js окружения
global.process = process;
