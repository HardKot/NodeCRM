import { ContentType } from './types';

class ParserContent {
  private constructor() {}


  static async toJSON(content: any): Promise<string> {
    if (typeof content === 'string') return content;
    return JSON.stringify(content);
  }

  static async toString(content: any): Promise<string> {
    if (typeof content === 'string') return content;
    if (typeof content.toString === 'function') return content.toString();
    return String(content);
  }

  static async fromJSON(content: string): Promise<any> {
    content = content.replace(/"_+proto_+"/g, '"_proto_"').replace(/"constructor"/g, '"_constructor_"');
    return JSON.parse(content);
  }

  static selectToParser(contentType: ContentType) {
    if (contentType === 'application/json') return this.toJSON.bind(this);
    if (contentType === 'text/plain') return this.toString.bind(this);
    if (contentType === 'text/html') return this.toString.bind(this);
    return null;
  }

  static selectFromParser(contentType: ContentType) {
    if (contentType === 'application/json') return this.fromJSON.bind(this);
    if (contentType === 'text/plain') return this.toString.bind(this);
    if (contentType === 'text/html') return this.toString.bind(this);
    return null;
  }
}


export { ParserContent };
