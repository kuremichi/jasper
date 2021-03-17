import { Observable } from 'rxjs';
import { JasperEngineRecipe } from './recipe';

type ArrayOneOrMore<T> = {
    0: T;
} & Array<T>;

export interface JasperRule {
    /**
     * the name of the rule
     */
    name: string;

    /**
     * a description of the rule
     */
    description: string;

    /**
     * lifecycle hook before the action is executed
     */
    beforeAction?: (context: ExecutionContext) => any;

    /**
     * the action to run
     * if the action is a string, it will be interpreted as a jsonata expression
     */
    action: string | Observable<unknown> | (() => any) | (() => Promise<any>);

    /**
     * lifecycle hook after the action has been executing executed
     */
    afterAction?: (context: ExecutionContext) => any;

    /**
     * lifecycle hook after the action has error
     */
    onError?: (error: any, context: ExecutionContext) => any;

    /**
     * the dependencies of the rule that will be executed
     */
    dependencies?: CompoundDependency | undefined;
}

export function isJasperRule(object: any): object is JasperRule {
    return 'name' in object && 'action' in object;
}

export interface CompoundDependency {
    /**
     *
     */
    name: string;

    /**
     * whether the children rule should be evaluated in parallel or sequentially
     * the default is parallel
     */
    executionOrder?: ExecutionOrder;

    /**
     *
     */
    operator?: Operator;

    /**
     *
     */
    rules: ArrayOneOrMore<CompoundDependency | SimpleDependency>;

    /**
     *
     */
    onError?: (error: any, context: ExecutionContext) => any;
}

export function isCompoundDependency(object: any): object is CompoundDependency {
    return 'name' in object && 'rules' in object;
}

export interface SimpleDependency {
    /**
     *
     */
    name: string;

    /**
     * path to locate the child element for evaluation
     * if string is passed, it will be treated as a jsonata expression and run the rule for each match
     * if function is passed, it will be executed. The response object will be the root for the child rule
     * if async function is passed, it will be executed and awaited. The response object will be the root for the child rule
     */
    path: string | ((context: ExecutionContext) => any);

    rule: string;

    when?: string | (() => boolean) | (() => Promise<boolean>) | Observable<boolean>;

    whenDescription?: string;

    required?: boolean;

    executionOrder?: ExecutionOrder;

    onError?: (error: any, context: ExecutionContext) => any;

    retry?: number;
}

export function isSimpleDependency(object: any): object is SimpleDependency {
    return 'name' in object && 'path' in object && 'rule' in object;
}

export enum Operator {
    AND = 'AND',
    OR = 'OR',
}

export enum ExecutionOrder {
    Sequential = 'Sequential',
    Parallel = 'Parallel',
}

export interface ExecutionContext {
    contextId: string;
    root: any;
    options: EngineOptions;
    rule: JasperRule;
    parentContext?: ExecutionContext;
    childrenContexts?: Record<string, ExecutionContext>;
    process: Observable<any>;
    complete: boolean;
}

export interface EngineOptions {
    suppressDuplicateTasks: boolean;
    recipe: JasperEngineRecipe;
    debug?: boolean;
}

export const DefaultEngineOptions: EngineOptions = {
    suppressDuplicateTasks: true,
    recipe: JasperEngineRecipe.ValidationRuleEngine,
    debug: false,
};
