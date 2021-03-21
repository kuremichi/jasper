import { CommonDependencyResponse } from './common.dependency.response';
import { SimpleDependencyExecutionResponse } from './simple.dependency.execution.response';
/**
 * response to capture the simple dependency
 */
export interface SimpleDependencyResponse extends CommonDependencyResponse {
    rule: string;
    matches: SimpleDependencyExecutionResponse[];
}
