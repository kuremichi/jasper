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
}
