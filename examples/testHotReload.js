import { CrmModule } from '../src/common/index.js';

console.log('=== Тест hot-reload функционала ===\n');

// Тест 1: Проверка кеша
console.log('Тест 1: Кеширование модулей');
const module1 = new CrmModule('./app/deps.js', { dirname: process.cwd() });
await module1.load();
console.log('Первая загрузка:', module1.exports.getValue()); // 0
module1.exports.increment();
console.log('После increment:', module1.exports.getValue()); // 1

// Загружаем тот же модуль снова - должен взяться из кеша
const module2 = new CrmModule('./app/deps.js', { dirname: process.cwd() });
await module2.load();
console.log('Загрузка из кеша:', module2.exports.getValue()); // 1 (то же состояние)
console.log('Размер кеша:', CrmModule.getCacheSize());
console.log('');

// Тест 2: Принудительная перезагрузка
console.log('Тест 2: forceReload');
const module3 = new CrmModule('./app/deps.js', {
  dirname: process.cwd(),
  forceReload: true,
});
await module3.load();
console.log('С forceReload:', module3.exports.getValue()); // 0 (новый экземпляр)
console.log('');

// Тест 3: Очистка кеша
console.log('Тест 3: Очистка кеша');
console.log('Размер кеша до очистки:', CrmModule.getCacheSize());
CrmModule.clearCache();
console.log('Размер кеша после очистки:', CrmModule.getCacheSize());
console.log('');

// Тест 4: Проверка TypeScript модуля
console.log('Тест 4: Загрузка TypeScript модуля');
const tsModule = new CrmModule('./app/api/staffControllers.ts', {
  dirname: process.cwd(),
});
await tsModule.load();
console.log('TypeScript модуль загружен!');
console.log('Экспорты:', Object.keys(tsModule.exports));
console.log('Тип default export:', typeof tsModule.exports.default);

const Controller = tsModule.exports.default;
console.log('Является контроллером:', Controller.isController);
console.log('GET handlers:', Controller.getHandlers ? Object.keys(Controller.getHandlers) : 'нет');
console.log('');

console.log('=== Все тесты пройдены! ===');
