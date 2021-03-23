import { Observable } from 'rxjs';
import { Rule } from './rule';
import { Operator, ExecutionOrder } from './enum';
import { ExecutionResponse } from './execution.response';
export interface ExecutionContext<T> {
    contextId: string;
    root: T;
    rule: Rule<T>;
    parentContext?: ExecutionContext<T>;
    childrenContexts?: Record<string, ExecutionContext<T>>;
    _process$: Observable<any>;
    complete: boolean;
    contextData: Record<string, any>;
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
