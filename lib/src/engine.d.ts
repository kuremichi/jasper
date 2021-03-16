import { Observable } from 'rxjs';
import { JasperRule, EngineOptions } from './rule.config';
import { ExecutionResponse } from './execution.response';
export declare class JasperEngine {
    private contextStore;
    private ruleStore;
    private readonly options;
    constructor(ruleStore: Record<string, JasperRule>, options?: EngineOptions);
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
