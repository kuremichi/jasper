import { Observable } from 'rxjs';
import { ExecutionOrder } from '../enum';
import { ExecutionContext } from '../execution.context';
import { SimpleDependencyExecutionResponse } from './simple.dependency.execution.response';
import { SimpleDependencyResponse } from './simple.dependency.response';
export interface SimpleDependency {
    name: string;
    path: string | ((context: ExecutionContext) => Observable<any>);
    rule: string;
    when?: string | ((context: ExecutionContext) => Observable<boolean>);
    whenDescription?: string;
    executionOrder?: ExecutionOrder;
    onDependencyError?: (error: any, response: SimpleDependencyResponse, context: ExecutionContext) => Observable<SimpleDependencyResponse>;
    beforeDependency?: (context: ExecutionContext) => Observable<any>;
    beforeEach?: (pathObject: any, index: number, context: ExecutionContext) => Observable<any>;
    onEachError?: (error: any, response: SimpleDependencyExecutionResponse, context: ExecutionContext) => Observable<SimpleDependencyExecutionResponse>;
    afterEach?: (pathObject: any, index: number, context: ExecutionContext) => Observable<any>;
    afterDependency?: (context: ExecutionContext) => Observable<any>;
    maxCurrency?: number;
    retry?: number;
}
export declare function isSimpleDependency(object: any): object is SimpleDependency;
