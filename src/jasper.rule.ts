import { Observable } from 'rxjs';
import { CompositeDependency } from './composite.dependency';
import { ExecutionContext } from './execution.context';
import { ExecutionResponse } from './execution.response';

export interface JasperRule {
    /**
     * the name of the rule
     */
    name: string;

    /**
     * a description of the rule
     */
    description: string;

    /**
     * lifecycle hook before the action is executed
     */
    beforeAction?: (context: ExecutionContext) => Observable<any>;

    /**
     * the action to run
     * if the action is a string, it will be interpreted as a jsonata expression
     */
    action: string | ((context: ExecutionContext) => Observable<unknown>);

    /**
     * lifecycle hook after the action has been executing executed
     */
    afterAction?: (response: ExecutionResponse, context: ExecutionContext) => Observable<ExecutionResponse>;

    /**
     * lifecycle hook after the action has error
     */
    onError?: (error: any, context: ExecutionContext) => any;

    /**
     * the dependencies of the rule that will be executed
     */
    dependencies?: CompositeDependency | undefined;

    /**
     * custom meta data defined by user
     */
    metadata?: Record<string, any>;
}

// export function isJasperRule(object: any): object is JasperRule {
//     return 'name' in object && 'action' in object;
// }


