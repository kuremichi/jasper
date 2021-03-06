import { Observable } from 'rxjs';
import { ExecutionOrder, Operator } from '../enum';
import { ExecutionContext } from '../execution.context';
import { SimpleDependencyExecutionResponse } from './simple.dependency.execution.response';
import { SimpleDependencyResponse } from './simple.dependency.response';

export interface SimpleDependency<T> {
    /**
     * a name or description for a dependency
     */
    name?: string;

    /**
     * path to locate the child element for evaluation
     * if string is passed, it will be treated as a jsonata expression and run the rule for each match
     * if function is passed, it will be executed. The response object will be the root for the child rule
     * if async function is passed, it will be executed and awaited. The response object will be the root for the child rule
     */
    path: string | ((context: ExecutionContext<T>) => Observable<any>);

    /**
     * a reference to the rule to be run
     */
    rule: string;

    /**
     * an expression to determine whenever the dependency should be executed
     */
    when?: string | ((context: ExecutionContext<T>) => Observable<boolean>);

    /**
     * a description for the when expression.
     */
    whenDescription?: string;

    /**
     * a description
     */
    executionOrder?: ExecutionOrder;

    /**
     * the operator to use when determining if this simple dependency is successful.
     * AND: all execution against objects returned by path should be successful.
     * OR: execution against any of the object returned by path should be successful.
     */
    operator?: Operator;

    /**
     * error handler for when this dependency execution had issue
     */
    onDependencyError?: (
        error: any,
        response: SimpleDependencyResponse,
        context: ExecutionContext<T>
    ) => Observable<SimpleDependencyResponse>;

    /**
     * the logic to run before the simple dependency is executed
     */
    beforeDependency?: (context: ExecutionContext<T>) => Observable<any>;

    /**
     * the logic to run before each dependency match is executed
     */
    beforeEach?: (pathObject: any, index: number, context: ExecutionContext<T>) => Observable<any>;

    /**
     * error handler for each execution against path object
     */
    onEachError?: (
        error: any,
        response: SimpleDependencyExecutionResponse,
        context: ExecutionContext<T>
    ) => Observable<SimpleDependencyExecutionResponse>;

    /**
     * the logic to run after each dependency match is executed
     */
    afterEach?: (pathObject: any, index: number, context: ExecutionContext<T>) => Observable<any>;

    /**
     * the logic to run after the simple dependency is executed
     */
    afterDependency?: (context: ExecutionContext<T>) => Observable<any>;

    /**
     * the maximum current execution to run for matches.
     * Default is unlimited
     */
    maxConcurrency?: number;
}

export function isSimpleDependency(object: any): object is SimpleDependency<any> {
    return 'name' in object && 'path' in object && 'rule' in object;
}
