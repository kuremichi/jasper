import { JasperEngineRecipe } from './recipe';
import { Observable } from 'rxjs';
import { JasperRule } from './rule.config';
import { ExecutionResponse } from './execution.response';
export declare class JasperEngine {
    private contextStore;
    private ruleStore;
    private options;
    constructor(ruleStore: Record<string, JasperRule>, options?: EngineOptions);
    private executeAction;
    private processPath;
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
export interface EngineOptions {
    suppressDuplicateTasks: boolean;
    recipe: JasperEngineRecipe;
}
export declare const DefaultEngineOptions: EngineOptions;
