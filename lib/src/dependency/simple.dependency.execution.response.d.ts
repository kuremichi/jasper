import { ExecutionResponse } from '../execution.response';
export interface SimpleDependencyExecutionResponse extends ExecutionResponse {
    name: string;
    index: number;
    rule: string;
}
