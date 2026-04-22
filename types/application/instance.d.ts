import { Module } from '../core';
import { EventEmitter } from 'node:events';
import { CommandBodyType, CommandReturnsType } from './command';
import { Logger } from './logger';
import { Result } from '../utils';
import { Plugin } from './plugin';
import { Session } from '../security';
declare const InstanceEvent: any;
export type InstanceModule = Module | AsyncIterable<Module>;
export type ExecCommand = (path: string, body: any, session?: Session | null, params?: Record<string, any> | null) => Promise<Result<any>>;
type InstanceEventType = (typeof InstanceEvent)[keyof typeof InstanceEvent];
export interface IInstance {
    execute: ExecCommand;
    commandsList: Readonly<Array<CommandInfo>>;
    plugins: Plugin[];
    on(event: InstanceEventType, listener: () => void): void;
    getProvider: <T>(bind: string | symbol) => Promise<T | null>;
}
export interface CommandInfo {
    name: string;
    body: CommandBodyType | null;
    returns: CommandReturnsType | null;
    params: Record<string, any> | null;
    metadata: any;
    description?: string;
}
declare class InstanceError extends Error {
}
declare class Instance extends EventEmitter implements IInstance {
    private readonly logger;
    readonly plugins: Plugin[];
    static create(moduleSource: InstanceModule | Promise<InstanceModule>, logger: Logger, plugins?: Plugin[]): unknown;
    private module;
    private container;
    private commands;
    commandsList: Readonly<Array<CommandInfo>>;
    constructor(moduleSource: InstanceModule, logger: Logger, plugins: Plugin[]);
    build(): any;
    execute(name: string, body: any, session: Session | null | undefined, params: null | undefined | object): unknown;
    getProvider<T>(token: string | symbol): Promise<T | null>;
    run(): any;
    private subscribeToModuleChanges;
    private linkModule;
    private combineComponents;
    private buildContainer;
    private buildCommands;
    private getCommandsFromConsumer;
    private buildPlugins;
    private generateCommandsList;
}
export { Instance, InstanceEvent, InstanceError };
