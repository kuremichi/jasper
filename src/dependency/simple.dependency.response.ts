import { CommonDependencyResponse } from './common.dependency.response';

/**
 * response to capture the simple dependency
 */
export interface SimpleDependencyResponse extends CommonDependencyResponse {
    // the dependency rule name
    rule: string;
}

/**
 * response for each of the simple dependency match result
 */
export interface SimpleDependencyExecutionResponse extends SimpleDependencyResponse {
    index: number;
    result: any;
}

