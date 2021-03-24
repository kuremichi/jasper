import { Observable } from 'rxjs';
import { ExecutionOrder, Operator } from '../enum';
import { ExecutionContext } from '../execution.context';
import { CompositeDependencyResponse } from './composite.dependency.response';

import { SimpleDependency } from './simple.dependency';

type ArrayOneOrMore<T> = {
    0: T;
} & Array<T>;

export interface CompositeDependency<T> {
    /**
     * a name for this dependency
     */
    name?: string;

    /**
     * whether the children rule should be evaluated in parallel or sequentially
     * the default is parallel
     */
    executionOrder?: ExecutionOrder;

    /**
     * the operator to use when determining if this composite dependency is successful.
     * AND: all dependencies under rules should be successful.
     * OR: any of the dependency under ruls should be successful.
     */
    operator?: Operator;

    /**
     * the composite dependency
     */
    rules: ArrayOneOrMore<CompositeDependency<T> | SimpleDependency<any>>;

    /**
     * an expression to determine if this dependency should run
     * either a string or function that returns an observable<boolean> is expected.
     * if string is provided, it will be evaluated using jsonata against the root object
     * of current execution context
     */
    when?: string | (() => Observable<boolean>);

    /**
     * a description for when condition descript the scenario
     */
    whenDescription?: string;

    /**
     * lifecycle handler to run when composite dependency encounters error
     */
    onDependencyError?: (
        error: any,
        response: CompositeDependencyResponse,
        context: ExecutionContext<T>
    ) => Observable<CompositeDependencyResponse>;

    /**
     * lifecycle handler to run before the composite dependency executes
     */
    beforeDependency?: (context: ExecutionContext<T>) => Observable<any>;

    /**
     * lifecycle handler to run after the composite dependency has executed
     */
    afterDependency?: (context: ExecutionContext<T>) => Observable<any>;

    /**
     * the max number of direct dependencies to be evaluate at a time
     * default is unlimited
     */
    maxConcurrency?: number;
}

export function isCompositeDependency(object: any): object is CompositeDependency<any> {
    return 'name' in object && 'rules' in object;
}
