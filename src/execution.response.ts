import { DebugContext } from './execution.context';
import { CompositeDependencyResponse } from './dependency/composite.dependency.response';

export interface ExecutionResponse {
    /**
     * the name of the rule that has been evaluated
     */
    rule: string;

    /**
     * the result returned from the rule action
     * for validation rules, this should be true/false
     */
    result: any;

    /**
     * whether there was error thrown during the rule execution
     */
    hasError: boolean;

    /**
     * the error
     */
    error?: any;

    /**
     * whether dependency is executed successfully
     * for worlkflow, this indicate whether there are exception occurred during the rule execution
     * for validation, in addition to above, this also means the result evaluates to true
     */
    isSuccessful: boolean;

    /**
     * the timestamp in UTC for when the rule execution starts
     */
    startTime?: Date;

    /**
     * the timestamp in UTC for when the rule execution ends
     */
    completeTime?: Date;

    /**
     * debug context
     */
    debugContext?: DebugContext | undefined;

    /**
     * the result for the dependency evaluation if any
     */
    dependency?: CompositeDependencyResponse | undefined;

    /**
     * metadata provided on the rule
     */
    metadata?: Record<string, any>;
}
