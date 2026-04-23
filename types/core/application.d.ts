import { BeanRegistry } from "./beanRegistry"
import { Config } from "./config"
import { Container } from "./container"

declare class Application {
    constructor(stdout: NodeJS.WriteStream, stderr: NodeJS.WriteStream)
    public registry: BeanRegistry
    public container: Container
    public prefix: string
    public logger: Console
    public config: Config
}

export { Application }