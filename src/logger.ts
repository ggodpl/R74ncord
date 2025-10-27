const MIN_LENGTH = 30;

export class Logger {
    // TODO: add date here somewhere
    static log(message: string, module?: string, prefix: string = "LOG", logDate: boolean = true) {
        const logPrefix = module ? `[${prefix} | ${module}]` : `[${prefix}]`;

        console.log(`${logPrefix}${" ".repeat(MIN_LENGTH - logPrefix.length)} ${message}`);
    }

    // TODO: add date here somewhere
    static error(message: string, module: string, prefix: string = "ERROR", logDate: boolean = true) {
        const logPrefix = `[${prefix} | ${module}]`;

        console.error(`${logPrefix}${" ".repeat(MIN_LENGTH - logPrefix.length)} ${message}`);
    }

    // TODO: add date here somewhere
    static warn(message: string, module: string, prefix: string = "WARN", logDate: boolean = true) {
        const logPrefix = `[${prefix} | ${module}]`;

        console.warn(`${logPrefix}${" ".repeat(MIN_LENGTH - logPrefix.length)} ${message}`);
    }

    // TODO: add date here somewhere
    static debug(message: string, module: string, prefix: string = "DEBUG", logDate: boolean = true) {
        const logPrefix = `[${prefix} | ${module}]`;

        console.debug(`${logPrefix}${" ".repeat(MIN_LENGTH - logPrefix.length)} ${message}`);
    }
}