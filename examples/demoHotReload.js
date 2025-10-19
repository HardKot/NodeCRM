// Демонстрация hot-reload в реальном времени
import { CrmModule, HotReload } from '../src/common/index.js';
import path from 'path';

console.log('=== Демонстрация Hot-Reload ===\n');

const hotReload = new HotReload();
const modulePath = './app/deps.js';
const fullPath = path.resolve(process.cwd(), modulePath);

// Загружаем модуль
const module = new CrmModule(modulePath, {
  dirname: process.cwd(),
});

await module.load();

console.log(`✓ Модуль загружен: ${fullPath}`);
console.log(`  Начальное значение: ${module.exports.getValue()}`);

// Изменяем состояние
module.exports.increment();
module.exports.increment();
module.exports.increment();
console.log(`  После 3 increment: ${module.exports.getValue()}`);

// Регистрируем hot-reload
let reloadedModule = module;
hotReload.watch(module, async newModule => {
  console.log('\n🔄 Модуль перезагружен!');
  console.log(`  Новое значение после reload: ${newModule.exports.getValue()}`);
  reloadedModule = newModule;
});

console.log(`\n👀 Отслеживается модулей: ${hotReload.getWatchCount()}`);
console.log('📝 Измените файл app/deps.js чтобы увидеть hot-reload');
console.log('   Например, добавьте комментарий или измените код');
console.log('   Нажмите Ctrl+C для выхода\n');

// Показываем текущее состояние каждые 2 секунды
const interval = setInterval(() => {
  console.log(`⏱  Текущее значение: ${reloadedModule.exports.getValue()}`);
}, 2000);

// Очистка при завершении
process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\n\n🛑 Остановка hot-reload...');
  hotReload.unwatchAll();
  console.log('✓ Готово!');
  process.exit(0);
});
