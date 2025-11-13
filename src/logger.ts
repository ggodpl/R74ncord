const MIN_LENGTH = 15;

export class Logger {
    static log(message: string, module?: string) {
        const logPrefix = module ? `[${module}]` : ``;

        console.log(`${logPrefix}${" ".repeat(Math.max(1, MIN_LENGTH - logPrefix.length))} ${message}`);
    }

    static error(message: string, module?: string, prefix: string = "ERROR") {
        const logPrefix = module ? `[${module} | ${prefix}]` : `[${prefix}]`;

        console.error(`${logPrefix}${" ".repeat(Math.max(1, MIN_LENGTH - logPrefix.length))} ${message}`);
    }

    static warn(message: string, module?: string, prefix: string = "WARN") {
        const logPrefix = module ? `[${module} | ${prefix}]` : `[${prefix}]`;

        console.warn(`${logPrefix}${" ".repeat(Math.max(1, MIN_LENGTH - logPrefix.length))} ${message}`);
    }

    static debug(message: string, module?: string, prefix: string = "DEBUG") {
        const logPrefix = module ? `[${module} | ${prefix}]` : `[${prefix}]`;

        console.debug(`${logPrefix}${" ".repeat(Math.max(1, MIN_LENGTH - logPrefix.length))} ${message}`);
    }
}