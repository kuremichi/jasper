import { ExecutionResponse } from '../execution.response';
/**
 * response for each of the simple dependency match result
 */
export interface SimpleDependencyExecutionResponse extends ExecutionResponse {
    /**
     *
     */
    name: string;
    /**
     * the match index
     */
    index: number;
    /**
     * the dependency rule name
     */
    rule: string;
}
