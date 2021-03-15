import { JasperEngineRecipe } from './recipe';
import { Observable } from 'rxjs';
import { JasperRule, ExecutionContext } from './rule.config';
import { ExecutionResponse } from './execution.response';
export declare class JasperEngine {
    contextStore: Record<string, ExecutionContext>;
    ruleStore: Record<string, JasperRule>;
    options: EngineOptions;
    constructor(options?: EngineOptions);
    private executeAction;
    private processPath;
    private processCompoundDependency;
    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     * @param params.parentExecutionContext [parent execution context] the parent context of current context
     */
    execute(params: {
        root: any;
        ruleName: string;
        parentExecutionContext?: ExecutionContext;
    }): Observable<ExecutionResponse>;
}
export interface EngineOptions {
    suppressDuplicateTasks: boolean;
    recipe: JasperEngineRecipe;
}
export declare const DefaultEngineOptions: EngineOptions;
