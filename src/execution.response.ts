import { Operator } from './rule.config';

export interface ExecutionResponse {
    rule: string;
    hasError: boolean;
    error?: any;
    isSuccessful: boolean;
    result: any;
    dependencies?: CompoundDependencyExecutionResponse | undefined;
    startDateTime?: Date;
    completedTime?: Date;
}

export interface SimpleDependencyExecutionResponse extends ExecutionResponse {
    name: string;
    isSkipped: boolean;
}

export interface CompoundDependencyExecutionResponse {
    name: string;
    hasError: boolean;
    isSuccessful: boolean;
    operator: Operator;
    rules: (SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse)[];
    startDateTime?: Date;
    completedTime?: Date;
}

export function isCompoundDependencyExecutionResponse(object: any): object is CompoundDependencyExecutionResponse {
    return 'operator' in object && 'rules' in object;
}