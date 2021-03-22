export interface ILogger {
    log(message: string, ...optionsParams: any[]): any;
    error(message: string, ...optionsParams: any[]): any;
    warn(message: string, ...optionsParams: any[]): any;
    debug(message: string, ...optionsParams: any[]): any;
    verbose(message: string, ...optionsParams: any[]): any;
}
export declare const DummyLogger: ILogger;
