import { Observable } from 'rxjs';
import { JasperRule } from './jasper.rule';

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
