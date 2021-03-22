import { CommonDependencyResponse } from './common.dependency.response';
import { SimpleDependencyExecutionResponse } from './simple.dependency.execution.response';
export interface SimpleDependencyResponse extends CommonDependencyResponse {
    rule: string;
    matches: SimpleDependencyExecutionResponse[];
}
