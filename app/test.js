import { ApiSpace } from '../src/api/apiSpace.js';
import path from 'node:path';

const api = new ApiSpace({ path: path.join(process.cwd(), 'app') });
await api.load();
