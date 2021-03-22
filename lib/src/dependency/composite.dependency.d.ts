import { Observable } from 'rxjs';
import { ExecutionOrder, Operator } from '../enum';
import { ExecutionContext } from '../execution.context';
import { CompositeDependencyResponse } from './composite.dependency.response';
import { SimpleDependency } from './simple.dependency';
declare type ArrayOneOrMore<T> = {
    0: T;
} & Array<T>;
export interface CompositeDependency {
    name: string;
    executionOrder?: ExecutionOrder;
    operator?: Operator;
    rules: ArrayOneOrMore<CompositeDependency | SimpleDependency>;
    when?: string | (() => Observable<boolean>);
    whenDescription?: string;
    onDependencyError?: (error: any, response: CompositeDependencyResponse, context: ExecutionContext) => Observable<CompositeDependencyResponse>;
    beforeDependency?: (context: ExecutionContext) => Observable<any>;
    afterDependency?: (context: ExecutionContext) => Observable<any>;
    maxCurrency?: number;
}
export declare function isCompositeDependency(object: any): object is CompositeDependency;
export {};
