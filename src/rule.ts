import { Observable } from 'rxjs';
import { CompositeDependency } from './dependency/composite.dependency';
import { ExecutionContext } from './execution.context';
import { ExecutionResponse } from './execution.response';

export interface Rule {
    /**
     * the name of the rule
     */
    name: string;

    /**
     * a description of the rule
     */
    description: string;

    /**
     *
     * by default Jasper Workflow Engine will hash the root object provided to the rule to determine its uniqueness
     * if you don't want the entire object to be considered and want to provide your own uniqueness algorithm, use this extension
     */
    uniqueBy?: (root: any) => any;

    /**
     * lifecycle hook before the action is executed
     */
    beforeAction?: (context: ExecutionContext) => Observable<any>;

    /**
     * the action to run
     * if the action is a string, it will be interpreted as a jsonata expression
     */
    action?: string | ((context: ExecutionContext) => Observable<unknown>);

    /**
     * lifecycle hook after the action has been executing executed
     */
    afterAction?: (context: ExecutionContext) => Observable<ExecutionResponse>;

    /**
     * lifecycle hook after the action has error
     */
    onError?: string | ((error: any, context: ExecutionContext) => Observable<any>);

    /**
     * the dependencies of the rule that will be executed
     */
    dependencies?: CompositeDependency | undefined;

    /**
     * custom meta data defined by user
     */
    metadata?: Record<string, any>;
}

// export function isRule(object: any): object is Rule {
//     return 'name' in object && 'action' in object;
// }
