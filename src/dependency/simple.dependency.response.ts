import { CommonDependencyResponse } from './common.dependency.response';
import { SimpleDependencyExecutionResponse } from './simple.dependency.execution.response';

/**
 * response to capture the simple dependency
 */
export interface SimpleDependencyResponse extends CommonDependencyResponse {
    // the dependency rule name
    rule: string;
    matches: SimpleDependencyExecutionResponse[];
}
