import * as process from 'node:process';
import * as path from 'node:path';
import * as fs from 'node:fs';
class HttpUtils {
    constructor() { }
    static readTLS(dir) {
        if (!dir)
            dir = path.join(process.cwd(), 'certs');
        const keyPath = path.join(dir, 'server.key');
        const certPath = path.join(dir, 'server.crt');
        return {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };
    }
    static isRestMethod(method) {
        return ['get', 'post', 'put', 'delete'].includes(method);
    }
}

export { HttpUtils };