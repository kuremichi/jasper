import { SimpleDependencyResponse } from './simple.dependency.response';
import { CommonDependencyResponse } from './common.dependency.response';

export interface CompositeDependencyResponse extends CommonDependencyResponse {
    rules: (SimpleDependencyResponse | CompositeDependencyResponse)[];
}

export function isCompositeDependencyResponse(object: any): object is CompositeDependencyResponse {
    return 'operator' in object && 'rules' in object;
}