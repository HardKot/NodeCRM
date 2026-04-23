const process = require('node:process');
const path = require('node:path');
const fs = require('node:fs');
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

exports.HttpUtils = HttpUtils;