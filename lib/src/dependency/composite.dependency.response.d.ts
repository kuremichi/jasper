import { SimpleDependencyResponse } from './simple.dependency.response';
import { CommonDependencyResponse } from './common.dependency.response';
export interface CompositeDependencyResponse extends CommonDependencyResponse {
    rules: (SimpleDependencyResponse | CompositeDependencyResponse)[];
}
export declare function isCompositeDependencyResponse(object: any): object is CompositeDependencyResponse;
