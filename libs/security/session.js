const crypto = require('node:crypto');
class Session extends Map {
    #hasChange = false;
    id;
    constructor(payload = {}, id) {
        super(Object.entries(payload));
        if (id) {
            this.id = id;
        }
        else {
            this.id = crypto.randomUUID();
        }
    }
    set(key, value) {
        super.set(key, value);
        this.#hasChange = true;
        return this;
    }
    get hasChange() {
        return this.#hasChange;
    }
    get roles() {
        return this.get('roles') ?? [];
    }
    get permissions() {
        return this.get('permissions') ?? [];
    }
}

exports.Session = Session;