import { aFunction } from './aModule.js';

export function bFunction() {
  return `bFunction:${aFunction()}`;
}
