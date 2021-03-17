import { Observable } from 'rxjs';
import { JasperRule, EngineOptions } from './rule.config';
import { ExecutionResponse } from './execution.response';
export declare class JasperEngine {
    private contextStore;
    private ruleStore;
    private readonly options;
    private numberOfGenerated;
    private generated;
    generated$: Observable<number>;
    private numberOfInProgress;
    private inProgress;
    inProgress$: Observable<number>;
    private numberOfCompleted;
    private completed;
    completed$: Observable<number>;
    throttle$: Observable<boolean>;
    constructor(ruleStore: Record<string, JasperRule>, options?: EngineOptions);
    /**
     * execute the rule action
     * @param params
     * @param params.action action to run
     * @param params.context the execution context
     *
     * @example jsonata expression
     * executeAction('jsonataExpression', context)
     *
     * @example observable
     * executeAction(of(1), context)
     *
     * @example async function
     * executeAction(async (context) => {}, context)
     *
     * @example function
     * executeAction((context) => {}, context)
     */
    private executeAction;
    /**
     * Process the path expression|function|observable
     * @param path the path expression | function | observable
     * @param context
     *
     * @example
     * processPath('jsonataExpression', context);
     *
     * @example
     * processPath((context) => {} , context);
     *
     * @example
     * processPath(async (context) => {} , context);
     *
     * @example
     * processPath(of(true), context);
     */
    private processPath;
    /**
     * generate a list tasks to be orchestrated by the compound dependency
     * @param accumulator
     * @param simpleDependency
     * @param context
     */
    private processSimpleDependency;
    private processCompoundDependency;
    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     * @param params.parentExecutionContext [parent execution context] the parent context of current context
     */
    private execute;
    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     */
    run(params: {
        root: any;
        ruleName: string;
    }): Observable<ExecutionResponse>;
}
