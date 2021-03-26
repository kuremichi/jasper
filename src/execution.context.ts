import { Observable } from 'rxjs';
import { Rule } from './rule';
import { Operator, ExecutionOrder, Direction } from './enum';
import { ExecutionResponse } from './execution.response';

/**
 * the context for current rule execution
 */
export interface ExecutionContext<T> {
    /**
     * a unique id computed based on the rule and root object of the rule
     * if suppressDuplicateTask mode is true, two paths in the rule that result in the same
     * rule evaluation against the same object should have same contextId
     */
    contextId: string;

    /**
     * the object passed to a rule as the root object
     */
    root: T;

    /**
     * the associated rule
     */
    rule: Rule<T>;

    /**
     * parent execution context
     */
    parentContext?: ExecutionContext<T>;

    /**
     * child execution contexts
     */
    childrenContexts?: Record<string, ExecutionContext<T>>;

    /**
     * the actual processing logic of the execution context
     */
    _process$: Observable<any>;

    /**
     *
     */
    complete: boolean;

    /**
     * this is where you could store some temp data to be shared between different lifecycle hook if needed.
     */
    contextData: Record<string, any>;

    /**
     * the execution response
     */
    response: ExecutionResponse;
}

export interface DebugContext {
    contextId?: string;
    root: any;
    ruleName?: string;
    parent?: any;
    operator?: Operator;
    executionOrder?: ExecutionOrder | undefined;
    whenDescription?: string;
}
