'use strict';

const path = require('node:path');
const fs = jest.createMockFromModule('fs');
const fsp = jest.createMockFromModule('fs/promises');

let mockFiles = Object.create(null);
let watchCallback = null;

fs.__setMockFiles = function __setMockFiles(newMockFiles) {
  mockFiles = Object.create(null);
  for (const file in newMockFiles) {
    mockFiles[file] = newMockFiles[file];
  }
};

fs.__setMockFile = function __setMockFile(newMockFiles) {
  for (const file in newMockFiles) {
    mockFiles[file] = newMockFiles[file];
  }
};

fsp.__setMockFiles = fs.__setMockFiles;

fs.__runWatchCallback = function __runWatchCallback(eventType, filename) {
  watchCallback?.(eventType, filename);
};
fsp.__runWatchCallback = fs.__runWatchCallback;

fs.readdirSync = function readdirSync(dirPath) {
  const dirItems = [];
  for (const file in mockFiles) {
    const parsedPath = path.parse(file);
    if (parsedPath.dir === dirPath) {
      dirItems.push({
        name: parsedPath.base,
        isFile: () => true,
        isDirectory: () => false,
      });
    }
  }
  return dirItems;
};
fsp.readdir = function readdir(dirPath) {
  return Promise.resolve(fs.readdirSync(dirPath));
};

fs.existsSync = function existsSync(filePath) {
  return filePath in mockFiles;
};

fs.readFileSync = function readFileSync(filePath) {
  return mockFiles[filePath];
};
fsp.readFile = function readFile(filePath) {
  return Promise.resolve(fs.readFileSync(filePath));
};

fs.watch = function watch(path, options, callback) {
  watchCallback = callback;
};
fsp.watch = function watchAsync(path, options) {
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          return new Promise(resolve => {
            watchCallback = () => {
              resolve({ done: false, value: [] });
            };
          });
        },
      };
    },
  };
};

fs.promise = fsp;

module.exports = fs;
