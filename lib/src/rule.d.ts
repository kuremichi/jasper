import { Observable } from 'rxjs';
import { CompositeDependency } from './dependency/composite.dependency';
import { ExecutionContext } from './execution.context';
import { ExecutionResponse } from './execution.response';
export interface Rule<T> {
    name: string;
    description: string;
    uniqueBy?: (root: T) => any;
    beforeAction?: (context: ExecutionContext<T>) => Observable<any>;
    action?: string | ((context: ExecutionContext<T>) => Observable<unknown>);
    afterAction?: (context: ExecutionContext<T>) => Observable<ExecutionResponse>;
    onError?: string | ((error: any, context: ExecutionContext<T>) => Observable<any>);
    dependencies?: CompositeDependency<T> | undefined;
    metadata?: Record<string, any>;
}
