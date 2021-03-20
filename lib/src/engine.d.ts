import { Observable } from 'rxjs';
import { JasperRule, EngineOptions } from './rule.config';
import { ExecutionResponse } from './execution.response';
export declare class JasperEngine {
    private contextStore;
    private ruleStore;
    private readonly options;
    private logger;
    /**
     *
     * @param ruleStore a dictionary of all rules
     * @param options options
     * @param logger logger
     */
    constructor(ruleStore: Record<string, JasperRule>, options?: EngineOptions, logger?: Console);
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
     * processExpression('jsonataExpression', context);
     *
     * @example
     * processExpression((context) => {} , context);
     *
     * @example
     * processExpression(async (context) => {} , context);
     *
     * @example
     * processExpression(of(true), context);
     */
    private processExpression;
    /**
     * Process a simple dependency
     * it will execute the path expression and for each match schedule an observables and add to the accumulator
     * @param accumulator a dictionary of tasks
     * @param compositeDependency the compound dependency object
     * @param context the current execution context
     */
    private processSimpleDependency;
    /**
     *
     * @param accumulator a dictionary of tasks
     * @param simpleDependency the simple dependency object
     * @param context the current execution context
     */
    private extractSimpleDependencyTasks;
    private extractCompositeDependencyTasks;
    /**
     *
     * @param compositeDependency
     * @param context
     */
    private collectDependencyTasks;
    /**
     * Process a compound dependency
     * @param compositeDependency the compound dependency object
     * @param context the current execution context
     */
    private processCompositeDependency;
    /**
     * execute the root object against a rule
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
