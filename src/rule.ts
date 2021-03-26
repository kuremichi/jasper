import { Observable } from 'rxjs';
import { CompositeDependency } from './dependency/composite.dependency';
import { Direction } from './enum';
import { ExecutionContext } from './execution.context';

export interface Rule<T> {
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
     *
     * @example students are the same if the studentId is the same
     * uniqueBy: (root: Stduent) => root.studentId
     *
     * @example two apples are identical if the variety and weight are the same
     * uniqueBy: (root: Apple) => ({ variety: root.variety, weight: root.weight })
     */
    uniqueBy?: (root: T) => any;

    /**
     * lifecycle hook before the action is executed
     */
    beforeAction?: (context: ExecutionContext<T>) => Observable<any>;

    /**
     * the action to run
     * if the action is a string, it will be interpreted as a jsonata expression
     */
    action?: string | ((context: ExecutionContext<T>) => Observable<any>);

    /**
     * lifecycle hook after the action has been executing executed
     */
    afterAction?: (context: ExecutionContext<T>) => Observable<any>;

    /**
     * lifecycle hook after the action has error
     */
    onError?: string | ((error: any, context: ExecutionContext<T>) => Observable<any>);

    /**
     * the dependencies of the rule that will be executed
     */
    dependencies?: CompositeDependency<T> | undefined;

    /**
     * custom metadata defined by user that will be returned on execution response
     */
    metadata?: Record<string, any>;

    /**
     * whether dependency should be evaluated before action
     * Direction.OutsideIn: rule will run first before its dependency
     * Direction.InsideOut: rule will run first after its dependency
     */
    direction?: Direction;
}

// export function isRule(object: any): object is Rule {
//     return 'name' in object && 'action' in object;
// }
