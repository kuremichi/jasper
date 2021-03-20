import { SimpleDependencyExecutionResponse } from './simple.dependency.response';
import { CommonDependencyResponse } from './common.dependency.response';

export interface CompositeDependencyExecutionResponse extends CommonDependencyResponse {
    rules: (SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse)[];
}

export function isCompositeDependencyExecutionResponse(object: any): object is CompositeDependencyExecutionResponse {
    return 'operator' in object && 'rules' in object;
}