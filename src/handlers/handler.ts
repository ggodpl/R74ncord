import { Base, BaseRegistrar } from "../base";
import { Bot } from "../bot";
import { readdirSync, statSync } from "fs";
import * as pth from "path";
import { Logger } from "../logger";

export abstract class Handler<T> extends BaseRegistrar<T> {
    registryName: string;
    directory: string;

    constructor (bot: Bot, registryName: string, directory: string) {
        super(bot);
        this.registryName = registryName;
        this.directory = directory;
    }

    async initalize() {
        Logger.log(`Initalizing ${this.registryName} handler`, "HANDLER");

        await this.loadDir(this.directory);
    }

    abstract load(path: string): Promise<void>;

    async loadDir(path: string) {
        const dirPath = pth.isAbsolute(path) ? path : pth.join(__dirname, "..", path);

        for (const file of readdirSync(dirPath)) {
            const filePath = pth.join(dirPath, file);
            const stats = statSync(filePath);

            if (stats.isDirectory()) {
                await this.loadDir(filePath);
            } else {
                await this.load(filePath);
            }
        }
    }

    register(name: string, entity: T) {
        this.registry.register(name, entity);
        Logger.log(`Registered ${name} in ${this.registryName}`, "HANDLER");
    }

    static formatPath(path: string) {
        return pth.relative(pth.join(process.cwd(), "out"), path).replace(/\\/g, "/");
    }
}