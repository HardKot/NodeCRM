# Hot Reload для CrmModule

## Возможности

Система hot-reload позволяет перезагружать модули в реальном времени без перезапуска приложения.

## 1. Принудительная перезагрузка (forceReload)

```javascript
import { CrmModule } from './src/common/index.js';

// Создаем модуль с опцией forceReload
const module = new CrmModule('./app/api/staffControllers.ts', {
  dirname: process.cwd(),
  forceReload: true, // Каждый load() будет очищать кеш
});

await module.load();
```

## 2. Ручная перезагрузка

```javascript
import { CrmModule } from './src/common/index.js';

const module = new CrmModule('./app/api/staffControllers.ts', {
  dirname: process.cwd(),
});

await module.load();

// Позже, когда нужно перезагрузить модуль
await module.reload();
```

## 3. Управление кешем

```javascript
// Очистить весь кеш модулей
CrmModule.clearCache();

// Очистить конкретный модуль
CrmModule.clearCache('/path/to/module.js');

// Проверить, закеширован ли модуль
if (CrmModule.hasCached('/path/to/module.js')) {
  console.log('Модуль в кеше');
}

// Получить размер кеша
console.log(`Закешировано модулей: ${CrmModule.getCacheSize()}`);
```

## 4. Автоматический hot-reload (с fs.watch)

```javascript
import { CrmModule, HotReload } from './src/common/index.js';

const hotReload = new HotReload();

// Загружаем модуль
const module = new CrmModule('./app/api/staffControllers.ts', {
  dirname: process.cwd(),
});
await module.load();

// Начинаем отслеживать изменения
hotReload.watch(module, async (newModule) => {
  console.log('Модуль обновлен!');
  
  // Обновляем роуты, контроллеры и т.д.
  const Controller = newModule.exports.default;
  updateRoutes(Controller);
});

// Остановить отслеживание конкретного модуля
hotReload.unwatch('./app/api/staffControllers.ts');

// Остановить все watchers
hotReload.unwatchAll();
```

## 5. Интеграция с ApiSpace

Пример интеграции hot-reload в `ApiSpace`:

```javascript
import { CrmSpace } from '../common/crmSpace.js';
import { Flow } from '../../libs/flow.js';
import { CrmModule, HotReload } from '../common/index.js';

export class ApiSpace {
  constructor(app) {
    this.space = new CrmSpace('api', app);
    this.app = app;
    this.hotReload = new HotReload();
    this.modules = new Map();
  }

  async load(enableHotReload = false) {
    const files = await Flow.of(this.space.load())
      .map(it => {
        const module = new CrmModule(it, {
          context: this.getContext(),
          runOptions: this.getRunOptions(),
          dirname: this.space.path,
          forceReload: enableHotReload,
        });
        
        if (enableHotReload) {
          this.hotReload.watch(module, (newModule) => {
            console.log(`[ApiSpace] Перезагружен: ${it}`);
            this.modules.set(it, newModule);
            // Обновляем роуты/контроллеры
            this.updateController(it, newModule);
          });
        }
        
        this.modules.set(it, module);
        return module;
      })
      .filter(it => it.isExists())
      .map(it => it.load())
      .get();
    
    return files;
  }

  updateController(path, module) {
    // Логика обновления контроллера
    console.log(`Обновление контроллера: ${path}`);
  }

  destroy() {
    this.hotReload.unwatchAll();
  }

  getContext() {
    return {};
  }

  getRunOptions() {
    return {};
  }
}
```

## 6. Пример с deps.ts

```javascript
// До изменений deps.ts
const module1 = new CrmModule('./app/deps.ts');
await module1.load();
console.log(module1.exports.getValue()); // 0
module1.exports.increment();
console.log(module1.exports.getValue()); // 1

// После изменения файла deps.ts, перезагружаем
await module1.reload();

// Состояние сброшено, так как модуль перезагружен
console.log(module1.exports.getValue()); // 0 (новый экземпляр)
```

## Важные замечания

1. **Состояние модуля**: При перезагрузке модуля его внутреннее состояние сбрасывается
2. **Зависимости**: Кеш зависимостей также очищается при перезагрузке
3. **Производительность**: Hot-reload использует `fs.watch`, который эффективен, но может вызвать несколько событий при одном изменении
4. **Память**: Старые экземпляры модулей должны быть собраны garbage collector'ом после перезагрузки

## Сценарии использования

- **Разработка**: Автоматическая перезагрузка контроллеров при изменении кода
- **Production**: Ручная перезагрузка конкретных модулей через API
- **Тестирование**: Очистка кеша между тестами для изоляции

