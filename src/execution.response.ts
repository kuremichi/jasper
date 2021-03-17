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
    dependencies?: CompoundDependencyExecutionResponse | undefined;
}

export interface SimpleDependencyExecutionResponse extends ExecutionResponse, CommonDependencyResponse {
    index?: number;
}

export interface CompoundDependencyExecutionResponse extends CommonResponse, CommonDependencyResponse {
    rules: (SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse)[];
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

export function isCompoundDependencyExecutionResponse(object: any): object is CompoundDependencyExecutionResponse {
    return 'operator' in object && 'rules' in object;
}
