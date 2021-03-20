import { ExecutionResponse } from '../execution.response';
import { CommonDependencyResponse } from './common.dependency.response';

/**
 * response for each of the simple dependency match result
 */
 export interface SimpleDependencyExecutionResponse extends CommonDependencyResponse {
    /**
     * the match index
     */
    index: number;
    /**
     * the dependency rule name
     */ 
    rule: string;
    /**
     * 
     */
    executionResponse?: ExecutionResponse;
}