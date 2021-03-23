import { Observable } from 'rxjs';
import { ExecutionOrder } from '../enum';
import { ExecutionContext } from '../execution.context';
import { SimpleDependencyExecutionResponse } from './simple.dependency.execution.response';
import { SimpleDependencyResponse } from './simple.dependency.response';
export interface SimpleDependency<T> {
    name: string;
    path: string | ((context: ExecutionContext<T>) => Observable<any>);
    rule: string;
    when?: string | ((context: ExecutionContext<T>) => Observable<boolean>);
    whenDescription?: string;
    executionOrder?: ExecutionOrder;
    onDependencyError?: (error: any, response: SimpleDependencyResponse, context: ExecutionContext<T>) => Observable<SimpleDependencyResponse>;
    beforeDependency?: (context: ExecutionContext<T>) => Observable<any>;
    beforeEach?: (pathObject: any, index: number, context: ExecutionContext<T>) => Observable<any>;
    onEachError?: (error: any, response: SimpleDependencyExecutionResponse, context: ExecutionContext<T>) => Observable<SimpleDependencyExecutionResponse>;
    afterEach?: (pathObject: any, index: number, context: ExecutionContext<T>) => Observable<any>;
    afterDependency?: (context: ExecutionContext<T>) => Observable<any>;
    maxCurrency?: number;
    retry?: number;
}
export declare function isSimpleDependency(object: any): object is SimpleDependency<any>;
