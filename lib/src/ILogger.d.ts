export interface ILogger {
    log(message: string, ...optionalParams: any[]): any;
    error(message: string, ...optionalParams: any[]): any;
    warn(message: string, ...optionalParams: any[]): any;
    debug(message: string, ...optionalParams: any[]): any;
    trace(message: string, ...optionalParams: any[]): any;
}
export declare const DummyLogger: ILogger;
