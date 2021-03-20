import { Observable } from 'rxjs';
import { JasperRule } from './jasper.rule';
import { Operator, ExecutionOrder } from './enum';

export interface ExecutionContext {
    contextId: string;
    root: any;
    rule: JasperRule;
    parentContext?: ExecutionContext;
    childrenContexts?: Record<string, ExecutionContext>;
    _process$: Observable<any>;
    complete: boolean;
    contextData: Record<string, any>;
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
