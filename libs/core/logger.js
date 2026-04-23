const console = require('node:console');
class Logger extends console.Console {
    prefix;
    stdout;
    stderr;
    constructor(prefix, stdout, stderr) {
        super(stdout, stderr);
        this.prefix = prefix;
        this.stdout = stdout;
        this.stderr = stderr;
    }
    log(...data) {
        const args = [Date.now().toString()];
        if (this.prefix)
            args.push(`| ${this.prefix}`);
        args.push('| LOG |', ...data);
        super.log(...args);
    }
    info(...data) {
        const args = [Date.now().toString()];
        if (this.prefix)
            args.push(`| ${this.prefix}`);
        args.push('| INFO |', ...data);
        super.info(...args);
    }
    warn(...data) {
        const args = [Date.now().toString()];
        if (this.prefix)
            args.push(`| ${this.prefix}`);
        args.push('| WARN |', ...data);
        super.warn(...args);
    }
    error(...data) {
        const args = [Date.now().toString()];
        if (this.prefix)
            args.push(`| ${this.prefix}`);
        args.push('| ERROR |', ...data);
        super.error(...args);
    }
    extend(prefix) {
        return new Logger(prefix, this.stdout, this.stderr);
    }
}

exports.Logger = Logger;