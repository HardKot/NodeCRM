declare class Config {
    getValue<T>(pathname: string, defaultValue?: T): T
}

export { Config }