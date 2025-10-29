const MIN_LENGTH = 15;

export class Logger {
    // TODO: add date here somewhere
    static log(message: string, module?: string, logDate: boolean = true) {
        const logPrefix = module ? `[${module}]` : ``;

        console.log(`${logPrefix}${" ".repeat(Math.max(1, MIN_LENGTH - logPrefix.length))} ${message}`);
    }

    // TODO: add date here somewhere
    static error(message: string, module?: string, prefix: string = "ERROR", logDate: boolean = true) {
        const logPrefix = module ? `[${module} | ${prefix}]` : `[${prefix}]`;

        console.error(`${logPrefix}${" ".repeat(Math.max(1, MIN_LENGTH - logPrefix.length))} ${message}`);
    }

    // TODO: add date here somewhere
    static warn(message: string, module?: string, prefix: string = "WARN", logDate: boolean = true) {
        const logPrefix = module ? `[${module} | ${prefix}]` : `[${prefix}]`;

        console.warn(`${logPrefix}${" ".repeat(Math.max(1, MIN_LENGTH - logPrefix.length))} ${message}`);
    }

    // TODO: add date here somewhere
    static debug(message: string, module?: string, prefix: string = "DEBUG", logDate: boolean = true) {
        const logPrefix = module ? `[${module} | ${prefix}]` : `[${prefix}]`;

        console.debug(`${logPrefix}${" ".repeat(Math.max(1, MIN_LENGTH - logPrefix.length))} ${message}`);
    }
}