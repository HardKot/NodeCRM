interface BeanProps {
    name: string;
    factory: Function;
    deps?: string[];
    aliases?: string[];
    eager?: boolean;
    async?: boolean;
    postConstruct?: Function[];
    preDestroy?: Function[];
}

declare class Bean {
    public readonly name: string;
    public readonly factory: Function;
    public readonly deps: string[];
    public readonly aliases: string[];
    public readonly eager: boolean;
    public readonly async: boolean;
    public readonly postConstruct: Function[];
    public readonly preDestroy: Function[];

    constructor(props: BeanProps);
}


export { Bean }