import * as querystring from 'node:querystring';
import * as stream from 'node:stream';
import * as streamWeb from 'node:stream/web';
import * as http2 from 'node:http2';
import * as path from 'node:path';

import { CommandBody, CommandInfo, CommandReturns } from '../application';
import { SpaceMetadataKey } from '../space';

import type { RESTMethod } from './types';


const RequestMetadataKey = Object.freeze({
  MAPPING: 'mapping',
  METHOD: 'method',
  STATUS_CODE: 'statusCode',
})


class Handle {
  static fromCommand(cmd: CommandInfo): Handle | null {
    let mapping = cmd.metadata.get<string>(RequestMetadataKey.MAPPING).getOrUndefined();
    if (!mapping) {
      let relativePath = cmd.metadata.get<string>(SpaceMetadataKey.RELATIVE_PATH).getOrUndefined();
      mapping = relativePath && this.getMappingFromRelativePath(relativePath);
    }

    if (!mapping) return null;

    const method = cmd.metadata
      .get<string>(RequestMetadataKey.METHOD)
      .map<RESTMethod>(it => it.toLowerCase() as RESTMethod)
      .filter(it => this.isRestMethod(it))
      .orElse('get');

    let statusCode = cmd.metadata
      .get<number>(RequestMetadataKey.STATUS_CODE)
      .orElseGet(() => (method === 'post' ? 201 : 200));

    return new Handle(cmd.name, mapping, method, statusCode, cmd.body, cmd.params, cmd.returns);
  }

  private static isRestMethod(method: string): method is RESTMethod {
    return ['get', 'post', 'put', 'delete'].includes(method);
  }

  private static getMappingFromRelativePath(relativePath: string): string | undefined {
    if (!relativePath) return undefined;
    const parse = path.parse(relativePath);
    const parts = parse.dir.split(path.sep);
    if (parts[0] === 'api') {
      return `/${parts.join('/')}/${parse.name.split(".")[0]}`;
    }
    return undefined;
  }

  constructor(
    public readonly name: string,
    public readonly mapping: string,
    public readonly httpMethod: RESTMethod,
    public readonly status: number,

    public readonly bodySchema: CommandBody,
    public readonly paramSchema: Record<string, any> | null,
    public readonly returnsSchema: CommandReturns
  ) {
    if (!this.mapping.startsWith('/')) this.mapping = '/' + this.mapping;
    if (this.mapping.endsWith('/')) this.mapping += 'index';

    Object.freeze(this);
  }

  public getParams(req: http2.Http2ServerRequest) {
    const url = req.url;
    if (!this.paramSchema) return null;

    const { pathName, search } = this.getSearchStr(url);
    const urlParams = this.getPathParams(pathName);
    const searchParams = this.getSearchParams(search);

    return Object.fromEntries(urlParams.concat(searchParams));
  }
  private getSearchStr(url: string) {
    const [pathName, ...searches] = url.split('?');

    return {
      pathName,
      search: searches.join('&'),
    };
  }
  private getSearchParams(searchPrams: string): [string, any][] {
    return Object.entries(querystring.parse(searchPrams));
  }
  private getPathParams(url: string): [string, any][] {
    const parts = url.split('/').filter(it => it);
    const mappingParts = this.mapping.split('/').filter(it => it);
    const paramsEntries: [string, any][] = [];

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



export { Handle };
