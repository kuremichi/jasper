declare module "src/enum" {
    export enum Operator {
        AND = "AND",
        OR = "OR"
    }
    export enum ExecutionOrder {
        Sequential = "Sequential",
        Parallel = "Parallel"
    }
    export enum JasperEngineRecipe {
        ValidationRuleEngine = 0,
        BusinessProcessEngine = 1
    }
}
declare module "src/engine.option" {
    import { JasperEngineRecipe } from "src/enum";
    export interface EngineOptions {
        suppressDuplicateTasks: boolean;
        recipe: JasperEngineRecipe;
        debug?: boolean;
    }
    export const DefaultEngineOptions: EngineOptions;
}
declare module "src/dependency/common.dependency.response" {
    import { DebugContext } from "src/execution.context";
    export interface CommonDependencyResponse {
        name: string;
        isSkipped: boolean;
        beforeDependencyResponse?: any;
        afterDependencyResponse?: any;
        hasError: boolean;
        errors: any[];
        isSuccessful: boolean;
        startTime?: Date;
        completeTime?: Date;
        debugContext?: DebugContext | undefined;
    }
}
declare module "src/execution.response" {
    import { DebugContext } from "src/execution.context";
    import { CompositeDependencyResponse } from "src/dependency/composite.dependency.response";
    export interface ExecutionResponse {
        rule: string;
        result: any;
        hasError: boolean;
        error?: any;
        isSuccessful: boolean;
        startTime?: Date;
        completeTime?: Date;
        debugContext?: DebugContext | undefined;
        dependency?: CompositeDependencyResponse | undefined;
        metadata?: Record<string, any>;
    }
}
declare module "src/dependency/simple.dependency.execution.response" {
    import { ExecutionResponse } from "src/execution.response";
    export interface SimpleDependencyExecutionResponse extends ExecutionResponse {
        name: string;
        index: number;
        rule: string;
    }
}
declare module "src/dependency/simple.dependency.response" {
    import { CommonDependencyResponse } from "src/dependency/common.dependency.response";
    import { SimpleDependencyExecutionResponse } from "src/dependency/simple.dependency.execution.response";
    export interface SimpleDependencyResponse extends CommonDependencyResponse {
        rule: string;
        matches: SimpleDependencyExecutionResponse[];
    }
}
declare module "src/dependency/composite.dependency.response" {
    import { SimpleDependencyResponse } from "src/dependency/simple.dependency.response";
    import { CommonDependencyResponse } from "src/dependency/common.dependency.response";
    export interface CompositeDependencyResponse extends CommonDependencyResponse {
        rules: (SimpleDependencyResponse | CompositeDependencyResponse)[];
    }
    export function isCompositeDependencyResponse(object: any): object is CompositeDependencyResponse;
}
declare module "src/dependency/simple.dependency" {
    import { Observable } from 'rxjs';
    import { ExecutionOrder } from "src/enum";
    import { ExecutionContext } from "src/execution.context";
    import { SimpleDependencyExecutionResponse } from "src/dependency/simple.dependency.execution.response";
    import { SimpleDependencyResponse } from "src/dependency/simple.dependency.response";
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
    export function isSimpleDependency(object: any): object is SimpleDependency;
}
declare module "src/dependency/composite.dependency" {
    import { Observable } from 'rxjs';
    import { ExecutionOrder, Operator } from "src/enum";
    import { ExecutionContext } from "src/execution.context";
    import { CompositeDependencyResponse } from "src/dependency/composite.dependency.response";
    import { SimpleDependency } from "src/dependency/simple.dependency";
    type ArrayOneOrMore<T> = {
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
    export function isCompositeDependency(object: any): object is CompositeDependency;
}
declare module "src/jasper.rule" {
    import { Observable } from 'rxjs';
    import { CompositeDependency } from "src/dependency/composite.dependency";
    import { ExecutionContext } from "src/execution.context";
    import { ExecutionResponse } from "src/execution.response";
    export interface JasperRule {
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
}
declare module "src/execution.context" {
    import { Observable } from 'rxjs';
    import { JasperRule } from "src/jasper.rule";
    import { Operator, ExecutionOrder } from "src/enum";
    import { ExecutionResponse } from "src/execution.response";
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
}
declare module "src/engine" {
    import { Observable } from 'rxjs';
    import { JasperRule } from "src/jasper.rule";
    import { EngineOptions } from "src/engine.option";
    import { ExecutionResponse } from "src/execution.response";
    export class JasperEngine {
        private contextStore;
        private ruleStore;
        private readonly options;
        private logger;
        constructor(ruleStore: Record<string, JasperRule>, options?: EngineOptions, logger?: Console);
        private executeAction;
        private processExpression;
        private processCompositeDependency;
        private processSimpleDependency;
        private execute;
        run(params: {
            root: any;
            ruleName: string;
        }): Observable<ExecutionResponse>;
    }
}
