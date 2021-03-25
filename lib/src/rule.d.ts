import { Observable } from 'rxjs';
import { CompositeDependency } from './dependency/composite.dependency';
import { ExecutionContext } from './execution.context';
export interface Rule<T> {
    name: string;
    description: string;
    uniqueBy?: (root: T) => any;
    beforeAction?: (context: ExecutionContext<T>) => Observable<any>;
    action?: string | ((context: ExecutionContext<T>) => Observable<any>);
    afterAction?: (context: ExecutionContext<T>) => Observable<any>;
    onError?: string | ((error: any, context: ExecutionContext<T>) => Observable<any>);
    dependencies?: CompositeDependency<T> | undefined;
    metadata?: Record<string, any>;
}
