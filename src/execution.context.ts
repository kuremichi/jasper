import { Observable } from 'rxjs';
import { JasperRule } from './rule';
import { Operator, ExecutionOrder } from './enum';
import { ExecutionResponse } from './execution.response';

export interface ExecutionContext {
    contextId: string;
    root: any;
    rule: JasperRule;
    parentContext?: ExecutionContext;
    childrenContexts?: Record<string, ExecutionContext>;
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
