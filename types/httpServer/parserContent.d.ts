import { ContentType } from './types';
declare class ParserContent {
    private constructor();
    static toJSON(content: any): Promise<string>;
    static toString(content: any): Promise<string>;
    static fromJSON(content: string): Promise<any>;
    static selectToParser(contentType: ContentType): any;
    static selectFromParser(contentType: ContentType): any;
}
export { ParserContent };
