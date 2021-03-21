import { DebugContext } from './execution.context';
import { CompositeDependencyResponse } from './dependency/composite.dependency.response';
export interface ExecutionResponse {
    rule: string;
    result: any;
    hasError: boolean;
    error?: any;
    isSuccessful: boolean;
    startTime?: Date;
    completeTime?: Date;
    debugContext?: DebugContext | undefined;
    dependency?: CompositeDependencyResponse | undefined;
    metadata?: Record<string, any>;
}
