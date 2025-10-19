import fs from 'fs';
import { CrmModule } from './crmModule.js';

export class HotReload {
  #watchers = new Map();
  #modules = new Map();

  /**
   * Регистрирует модуль для hot-reload
   * @param {CrmModule} module - Модуль для отслеживания
   * @param {Function} onReload - Callback при перезагрузке
   */
  watch(module, onReload) {
    if (this.#watchers.has(module.path)) {
      return; // Уже отслеживается
    }

    this.#modules.set(module.path, { module, onReload });

    const watcher = fs.watch(module.path, { persistent: false }, async eventType => {
      if (eventType === 'change') {
        try {
          console.log(`[HotReload] Обнаружены изменения в ${module.path}`);

          // Очищаем кеш модуля и его зависимостей
          CrmModule.clearCache(module.path);

          // Создаем новый экземпляр модуля
          const newModule = new CrmModule(module.path, {
            context: module.context,
            runOptions: module.runOptions,
            dirname: module.dirname,
            relativePath: module.relative,
            forceReload: true,
          });

          await newModule.load();

          console.log(`[HotReload] Модуль ${module.path} успешно перезагружен`);

          if (onReload) {
            await onReload(newModule);
          }

          // Обновляем ссылку на модуль
          this.#modules.get(module.path).module = newModule;
        } catch (error) {
          console.error(`[HotReload] Ошибка при перезагрузке ${module.path}:`, error.message);
        }
      }
    });

    this.#watchers.set(module.path, watcher);
    console.log(`[HotReload] Отслеживание ${module.path}`);
  }

  /**
   * Останавливает отслеживание модуля
   * @param {string} modulePath - Путь к модулю
   */
  unwatch(modulePath) {
    const watcher = this.#watchers.get(modulePath);
    if (watcher) {
      watcher.close();
      this.#watchers.delete(modulePath);
      this.#modules.delete(modulePath);
      console.log(`[HotReload] Остановлено отслеживание ${modulePath}`);
    }
  }

  /**
   * Останавливает все watchers
   */
  unwatchAll() {
    for (const [path, watcher] of this.#watchers) {
      watcher.close();
      console.log(`[HotReload] Остановлено отслеживание ${path}`);
    }
    this.#watchers.clear();
    this.#modules.clear();
  }

  /**
   * Получает текущий модуль
   * @param {string} modulePath - Путь к модулю
   */
  getModule(modulePath) {
    return this.#modules.get(modulePath)?.module;
  }

  /**
   * Проверяет, отслеживается ли модуль
   * @param {string} modulePath - Путь к модулю
   */
  isWatching(modulePath) {
    return this.#watchers.has(modulePath);
  }

  /**
   * Получает количество отслеживаемых модулей
   */
  getWatchCount() {
    return this.#watchers.size;
  }
}
