import { ApiSpace } from '../src/api/apiSpace.js';
import path from 'node:path';

const api = new ApiSpace({ path: path.join(process.cwd(), 'app') });
const modules = await api.load();

const test1 = new modules[0].exports.default();
const test2 = new modules[1].exports.default();

console.log(test1.post());
console.log(test2.post());
