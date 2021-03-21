import { DebugContext } from './execution.context';
import { CompositeDependencyResponse } from './dependency/composite.dependency.response';


export interface ExecutionResponse {
    rule: string;
    result: any;
    /**
     * whether dependency has error
     */
    hasError: boolean;

    /**
     * the error
     */
    error?: any;

    /**
     * whether dependency is executed successfully
     */
    isSuccessful: boolean;

    /**
     * dependency start time
     */
    startDateTime?: Date;

    /**
     * dependency end time
     */
    completedTime?: Date;

    /**
     * debug context
     */
    debugContext?: DebugContext | undefined;
    dependency?: CompositeDependencyResponse | undefined;
}