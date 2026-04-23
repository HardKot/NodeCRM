const querystring = require('node:querystring');
const path = require('node:path');
const RequestMetadataKey = Object.freeze({
    MAPPING: 'mapping',
    METHOD: 'method',
    STATUS_CODE: 'statusCode',
});
function getCommandMeta(metadata, key, defaultValue = undefined) {
    if (!metadata)
        return defaultValue;
    const value = metadata[key];
    return typeof value === 'undefined' ? defaultValue : value;
}
class Handle {
    name;
    mapping;
    httpMethod;
    status;
    bodySchema;
    paramSchema;
    returnsSchema;
    static fromCommand(cmd) {
        const mapping = getCommandMeta(cmd.metadata, RequestMetadataKey.MAPPING);
        if (!mapping)
            return null;
        const rawMethod = getCommandMeta(cmd.metadata, RequestMetadataKey.METHOD, 'get');
        const method = typeof rawMethod === 'string'
            ? rawMethod.toLowerCase()
            : 'get';
        let statusCode = getCommandMeta(cmd.metadata, RequestMetadataKey.STATUS_CODE, method === 'post' ? 201 : 200);
        return new Handle(cmd.name, mapping, method, statusCode, cmd.body, cmd.params, cmd.returns);
    }
    static isRestMethod(method) {
        return ['get', 'post', 'put', 'delete'].includes(method);
    }
    static getMappingFromRelativePath(relativePath) {
        if (!relativePath)
            return undefined;
        const parse = path.parse(relativePath);
        const parts = parse.dir.split(path.sep);
        if (parts[0] === 'api') {
            return `/${parts.join('/')}/${parse.name.split(".")[0]}`;
        }
        return undefined;
    }
    constructor(name, mapping, httpMethod, status, bodySchema, paramSchema, returnsSchema) {
        this.name = name;
        this.mapping = mapping;
        this.httpMethod = httpMethod;
        this.status = status;
        this.bodySchema = bodySchema;
        this.paramSchema = paramSchema;
        this.returnsSchema = returnsSchema;
        if (!this.mapping.startsWith('/'))
            this.mapping = '/' + this.mapping;
        if (this.mapping.endsWith('/'))
            this.mapping += 'index';
        Object.freeze(this);
    }
    getParams(req) {
        const url = req.url;
        if (!this.paramSchema)
            return null;
        const { pathName, search } = this.getSearchStr(url);
        const urlParams = this.getPathParams(pathName);
        const searchParams = this.getSearchParams(search);
        return Object.fromEntries(urlParams.concat(searchParams));
    }
    getSearchStr(url) {
        const [pathName, ...searches] = url.split('?');
        return {
            pathName,
            search: searches.join('&'),
        };
    }
    getSearchParams(searchPrams) {
        return Object.entries(querystring.parse(searchPrams));
    }
    getPathParams(url) {
        const parts = url.split('/').filter(it => it);
        const mappingParts = this.mapping.split('/').filter(it => it);
        const paramsEntries = [];
        for (let i = 0; i < mappingParts.length; i++) {
            const mp = mappingParts[i];
            if (mp.startsWith('<') && mp.endsWith('>')) {
                const [paramName] = mp.slice(1, -1).split(":");
                paramsEntries.push([paramName, parts[i]]);
            }
        }
        return paramsEntries;
    }
}

exports.Handle = Handle;