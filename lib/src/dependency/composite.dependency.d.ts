import { Observable } from 'rxjs';
import { ExecutionOrder, Operator } from '../enum';
import { ExecutionContext } from '../execution.context';
import { CompositeDependencyResponse } from './composite.dependency.response';
import { SimpleDependency } from './simple.dependency';
declare type ArrayOneOrMore<T> = {
    0: T;
} & Array<T>;
export interface CompositeDependency<T> {
    name: string;
    executionOrder?: ExecutionOrder;
    operator?: Operator;
    rules: ArrayOneOrMore<CompositeDependency<any> | SimpleDependency<any>>;
    when?: string | (() => Observable<boolean>);
    whenDescription?: string;
    onDependencyError?: (error: any, response: CompositeDependencyResponse, context: ExecutionContext<T>) => Observable<CompositeDependencyResponse>;
    beforeDependency?: (context: ExecutionContext<T>) => Observable<any>;
    afterDependency?: (context: ExecutionContext<T>) => Observable<any>;
    maxCurrency?: number;
}
export declare function isCompositeDependency(object: any): object is CompositeDependency<any>;
export {};
