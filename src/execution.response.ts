import { Operator, ExecutionOrder } from './rule.config';

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
    executionOrder: ExecutionOrder;
    index?: number;
}

export interface CompoundDependencyExecutionResponse {
    name: string;
    hasError: boolean;
    isSuccessful: boolean;
    operator: Operator;
    executionOrder: ExecutionOrder;
    rules: (SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse)[];
    startDateTime?: Date;
    completedTime?: Date;
}

export function isCompoundDependencyExecutionResponse(object: any): object is CompoundDependencyExecutionResponse {
    return 'operator' in object && 'rules' in object;
}