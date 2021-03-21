import { DebugContext } from '../execution.context';
export interface CommonDependencyResponse {
    name: string;
    isSkipped: boolean;
    beforeDependencyResponse?: any;
    afterDependencyResponse?: any;
    /**
     * whether dependency has error
     */
    hasError: boolean;
    /**
     * the error
     */
    errors: any[];
    /**
     * whether dependency is executed successfully
     */
    isSuccessful: boolean;
    /**
     * dependency start time
     */
    startTime?: Date;
    /**
     * dependency end time
     */
    completeTime?: Date;
    /**
     * debug context
     */
    debugContext?: DebugContext | undefined;
}
