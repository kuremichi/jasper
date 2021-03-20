import { Operator, ExecutionOrder } from './rule.config';
interface CommonResponse {
    hasError: boolean;
    error?: any;
    isSuccessful: boolean;
    startDateTime?: Date;
    completedTime?: Date;
    debugContext?: DebugContext | undefined;
}
interface CommonDependencyResponse {
    name: string;
    isSkipped: boolean;
}
export interface ExecutionResponse extends CommonResponse {
    rule: string;
    result: any;
    dependency?: CompositeDependencyExecutionResponse | undefined;
}
export interface SimpleDependencyExecutionResponse extends ExecutionResponse, CommonDependencyResponse {
    index?: number;
}
export interface CompositeDependencyExecutionResponse extends CommonResponse, CommonDependencyResponse {
    rules: (SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse)[];
}
export interface DebugContext {
    contextId?: string;
    root: any;
    ruleName?: string;
    parent?: any;
    operator?: Operator;
    executionOrder?: ExecutionOrder | undefined;
    whenDescription?: string;
}
export declare function isCompositeDependencyExecutionResponse(object: any): object is CompositeDependencyExecutionResponse;
export {};
