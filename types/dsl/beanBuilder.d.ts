class BeanBuilder {
    constructor();
    name(name: string): BeanBuilder;
    eager(): BeanBuilder;
    async(): BeanBuilder;

    singleton(): BeanBuilder;
    transient(): BeanBuilder;
    scoped(): BeanBuilder;

    dependsOn(...deps: string[]): BeanBuilder;
    alias(...aliases: string[]): BeanBuilder;
    postConstruct(...methods: Function[]): BeanBuilder;
    preDestroy(...methods: Function[]): BeanBuilder;
}

export { BeanBuilder }