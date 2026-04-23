class Application {
    constructor() {
        this.container = new Container(this);
        this.beanRegistry = new BeanRegistry(this);
    }
}


exports.Application = Application;