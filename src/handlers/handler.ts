import { Base, BaseRegistrar, Initializable } from "../base";
import { Bot } from "../bot";
import { readdirSync, statSync } from "fs";
import { isAbsolute, join, relative } from "path";
import { Logger } from "../logger";

export abstract class Handler<T> extends BaseRegistrar<T> implements Initializable<never> {
    registryName: string;
    directory: string;

    constructor (bot: Bot, registryName: string, directory: string) {
        super(bot);
        this.registryName = registryName;
        this.directory = directory;
    }

    async initialize() {
        Logger.log(`Initalizing ${this.registryName} handler`, "HANDLER");

        await this.loadDir(this.directory, true);

        return true;
    }

    abstract load(path: string, dirPath: string, base: boolean): Promise<void>;

    async loadDir(path: string, base: boolean) {
        const dirPath = isAbsolute(path) ? path : join(__dirname, "..", path);

        for (const file of readdirSync(dirPath)) {
            const filePath = join(dirPath, file);
            const stats = statSync(filePath);

            if (stats.isDirectory()) {
                await this.loadDir(filePath, false);
            } else {
                await this.load(filePath, dirPath, base);
            }
        }
    }

    register(name: string, entity: T) {
        this.registry.register(name, entity);
        Logger.log(`Registered ${name} in ${this.registryName}`, "HANDLER");
    }

    static formatPath(path: string) {
        return relative(join(process.cwd(), "out"), path).replace(/\\/g, "/");
    }
}