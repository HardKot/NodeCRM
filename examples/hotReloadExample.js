// Пример использования hot-reload для модулей

import { CrmModule, HotReload } from '../src/common/index.js';

// Создаем экземпляр hot-reload
const hotReload = new HotReload();

// Загружаем модуль
const staffModule = new CrmModule('./app/api/staffControllers.ts', {
  dirname: process.cwd(),
});

await staffModule.load();

// Регистрируем модуль для отслеживания изменений
hotReload.watch(staffModule, async newModule => {
  console.log('Модуль перезагружен! Новые экспорты:', Object.keys(newModule.exports));

  // Здесь можно обновить роуты, контроллеры и т.д.
  // Например, обновить API endpoints
});

console.log(`Отслеживается модулей: ${hotReload.getWatchCount()}`);
console.log('Ожидание изменений... (Ctrl+C для выхода)');

// Пример: принудительная перезагрузка модуля
// CrmModule.clearCache(staffModule.path);
// await staffModule.reload();

// Очистка при завершении
process.on('SIGINT', () => {
  console.log('\nОстановка hot-reload...');
  hotReload.unwatchAll();
  process.exit(0);
});
