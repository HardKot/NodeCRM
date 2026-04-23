import { Application } from "../application";

class BeanRegistry {
    public app: Application;
    constructor(app: Application, beans?: Bean[]);

    public add(bean: Bean): void;
    public getDef(alias: string): Bean;
    public getAllDefs(): Bean[];

    public validate(): boolean;
}

export { BeanRegistry }