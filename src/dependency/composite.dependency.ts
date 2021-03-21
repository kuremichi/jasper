import { Observable } from 'rxjs';
import { ExecutionOrder, Operator } from '../enum';
import { ExecutionContext } from '../execution.context';
import { CompositeDependencyResponse } from './composite.dependency.response';

import { SimpleDependency } from './simple.dependency';

type ArrayOneOrMore<T> = {
    0: T;
} & Array<T>;

export interface CompositeDependency {
    /**
     *
     */
    name: string;

    /**
     * whether the children rule should be evaluated in parallel or sequentially
     * the default is parallel
     */
    executionOrder?: ExecutionOrder;

    /**
     *
     */
    operator?: Operator;

    /**
     *
     */
    rules: ArrayOneOrMore<CompositeDependency | SimpleDependency>;

    /**
     *
     */
    when?: string | (() => Observable<boolean>);

    /**
     *
     */
    whenDescription?: string;

    /**
     * lifecycle handler to run when composite dependency encounters error
     */
    onDependencyError?: (
        error: any,
        response: CompositeDependencyResponse,
        context: ExecutionContext
    ) => Observable<CompositeDependencyResponse>;

    /**
     * lifecycle handler to run before the composite dependency executes
     */
    beforeDependency?: (context: ExecutionContext) => Observable<any>;

    /**
     * lifecycle handler to run after the composite dependency has executed
     */
    afterDependency?: (context: ExecutionContext) => Observable<any>;

    /**
     * the max number of direct dependencies to be evaluate at a time
     */
    maxCurrency?: number;
}

export function isCompositeDependency(object: any): object is CompositeDependency {
    return 'name' in object && 'rules' in object;
}
