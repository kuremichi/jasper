import { Observable } from 'rxjs';
import { ExecutionOrder } from './enum';
import { ExecutionContext } from './execution.context';


export interface SimpleDependency {
    /**
     * a name or description for a dependency
     */
    name: string;

    /**
     * path to locate the child element for evaluation
     * if string is passed, it will be treated as a jsonata expression and run the rule for each match
     * if function is passed, it will be executed. The response object will be the root for the child rule
     * if async function is passed, it will be executed and awaited. The response object will be the root for the child rule
     */
    path: string | ((context: ExecutionContext) => Observable<any>);

    /**
     * a reference to the rule to be run
     */
    rule: string;

    /**
     * an expression to determine whenever the dependency should be executed
     */
    when?: string | ((context: ExecutionContext) => Observable<boolean>);

    /**
     * a description for the when expression.
     */
    whenDescription?: string;

    /**
     * a description
     */
    executionOrder?: ExecutionOrder;

    /**
     * 
     */
    onError?: (error: any, context: ExecutionContext) => any;

    /**
     * 
     */
    retry?: number;
}

export function isSimpleDependency(object: any): object is SimpleDependency {
    return 'name' in object && 'path' in object && 'rule' in object;
}