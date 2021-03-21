import { Observable } from 'rxjs';
import { CompositeDependency } from './dependency/composite.dependency';
import { ExecutionContext } from './execution.context';
import { ExecutionResponse } from './execution.response';
export interface Rule {
    name: string;
    description: string;
    uniqueBy?: (root: any) => any;
    beforeAction?: (context: ExecutionContext) => Observable<any>;
    action: string | ((context: ExecutionContext) => Observable<unknown>);
    afterAction?: (context: ExecutionContext) => Observable<ExecutionResponse>;
    onError?: (error: any, context: ExecutionContext) => Observable<ExecutionResponse>;
    dependencies?: CompositeDependency | undefined;
    metadata?: Record<string, any>;
}
