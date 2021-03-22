/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
export interface ILogger {
    log(message: string, ...optionalParams: any[]): any;
    error(message: string, ...optionalParams: any[]): any;
    warn(message: string, ...optionalParams: any[]): any;
    debug(message: string, ...optionalParams: any[]): any;
    trace(message: string, ...optionalParams: any[]): any;
}

/* istanbul ignore next */
export const DummyLogger: ILogger = {
    log: (_message: string) => {},
    error: (_message: string) => {},
    warn: (_message: string) => {},
    debug: (_message: string) => {},
    trace: (_message: string) => {},
};
