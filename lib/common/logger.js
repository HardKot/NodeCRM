import fsp from 'node:fs/promises';
import chalk from 'chalk';

import * as config from './config.js';
import fs from 'fs';
import path from 'node:path';

const LOGGER_ENABLED = config.get('logger.enabled', true);
const LOGGER_SEVERITY = config.get('logger.severity', 'info').toUpperCase();
const LOGGER_TRANSPORT = config.get('logger.transport', 'console');
const LOGGER_CUSTOM_LEVELS = config.get('logger.levels', {});
const SHOW_TIMESTAMP = config.get('logger.showTimestamp', true);
const SHOW_LEVEL = config.get('logger.showLevel', true);
const TIMESTAMP_FORMAT = config.get('logger.timestampFormat', 'iso');
const LOGGER_DIR = config.get('logger.dir', 'logs');

class LogLevel {
  constructor(name, severity) {
    this.name = name;
    this.severity = severity;
    Object.freeze(this);
  }
}

// Уровни логирования
export const LogLevels = {
  DEBUG: new LogLevel('DEBUG', 10),
  INFO: new LogLevel('INFO', 20),
  WARN: new LogLevel('WARN', 30),
  ERROR: new LogLevel('ERROR', 40),
};

/**
 *
 * @param level {LogLevel}
 * @param message {string}
 * @param args {any[]}
 */
function log(level, message, ...args) {
  if (!LOGGER_ENABLED) return;
  if (level.severity < LOGGER_SEVERITY) return;

  const logEntry = {
    timestamp: new Date(),
    levelName: level.name,
    message: message,
    args: args,
  };

  switch (LOGGER_TRANSPORT) {
    case 'console':
      transportToConsole(logEntry);
      break;
    case 'file':
      transportToFile(logEntry).catch(err => console.error('Logger file transport error:', err));
      break;
  }
}

function formatArgs(args) {
  return args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
    .join(' ');
}
function formatTimestamp(date) {
  switch (TIMESTAMP_FORMAT) {
    case 'iso':
      return date.toISOString();
    case 'locale':
      return date.toLocaleString();
    case 'time':
      return date.toLocaleTimeString();
    case 'short':
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    default:
      const map = {
        YYYY: date.getFullYear(),
        MM: String(date.getMonth() + 1).padStart(2, '0'),
        DD: String(date.getDate()).padStart(2, '0'),
        HH: String(date.getHours()).padStart(2, '0'),
        mm: String(date.getMinutes()).padStart(2, '0'),
        ss: String(date.getSeconds()).padStart(2, '0'),
      };
      return TIMESTAMP_FORMAT.replace(/YYYY|MM|DD|HH|mm|ss/g, match => map[match]);
  }
}

function transportToConsole(logEntry) {
  let formatted = '';

  if (SHOW_TIMESTAMP) formatted += `${formatTimestamp(logEntry.timestamp)} `;
  if (SHOW_LEVEL) formatted += `|${logEntry.levelName}| `;
  formatted += logEntry.message;

  if (logEntry.args.length > 0) {
    formatted += ' ' + formatArgs(logEntry.args);
  }

  console.log(formatted);
}

async function transportToFile(logEntry) {
  let formatted = '';

  if (SHOW_TIMESTAMP) formatted += `${formatTimestamp(logEntry.timestamp)} `;
  if (SHOW_LEVEL) formatted += `${logEntry.levelName} `;
  formatted += logEntry.message;

  if (logEntry.args.length > 0) {
    formatted += ' ' + formatArgs(logEntry.args);
  }
  formatted += '\n';

  const file = path.join(LOGGER_DIR, `app.log`);
  if (!fs.existsSync(file)) {
    await fsp.mkdir(LOGGER_DIR, { recursive: true });
    await fsp.writeFile(file, formatted);
  } else {
    await fsp.appendFile(file, formatted);
  }
}

export const logger = {
  debug(message, ...args) {
    log(LogLevels.DEBUG, message, ...args);
  },
  info(message, ...args) {
    log(LogLevels.INFO, message, ...args);
  },
  warn(message, ...args) {
    log(LogLevels.WARN, message, ...args);
  },
  error(message, ...args) {
    log(LogLevels.ERROR, message, ...args);
  },
};

for (const LevelName in LOGGER_CUSTOM_LEVELS) {
  const levelConfig = LOGGER_CUSTOM_LEVELS[LevelName];

  let name = LevelName.toUpperCase();
  let severity = 0;
  let color = 'white';

  if (typeof levelConfig === 'object') {
    severity = +levelConfig.severity;
    color = levelConfig.color;
  } else {
    severity = +levelConfig;
  }

  const logLevel = new LogLevel(name, severity, color);

  logger[name.toLowerCase()] = function (message, ...args) {
    log(logLevel, message, ...args);
  };
}
