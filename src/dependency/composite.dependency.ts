import { Observable } from 'rxjs';
import { ExecutionOrder, Operator } from '../enum';
import { ExecutionContext } from '../execution.context';
import { CompositeDependencyExecutionResponse } from './composite.dependency.response';

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
    onError?: (error: any, context: ExecutionContext) => Observable<any>;

    /**
     * 
     */
    when?: string | (() => Observable<boolean>);

    /**
     * 
     */
    whenDescription?: string;

    /**
     * 
     */
     onDependencyError?: (error: any, response: CompositeDependencyExecutionResponse, context: ExecutionContext) => Observable<SimpleDependencyResponse>;

     /**
      * the logic to run before the simple dependency is executed
      */
     beforeDependency?: ((context: ExecutionContext) => Observable<any>);
 
     /**
      * the logic to run after the simple dependency is executed
      */
     afterDependency?: ((context: ExecutionContext) => Observable<any>);

     maxCurrency?: number;
}

export function isCompositeDependency(object: any): object is CompositeDependency {
    return 'name' in object && 'rules' in object;
}