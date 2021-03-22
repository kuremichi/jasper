import { Observable } from 'rxjs';
import { EngineOptions } from './engine.option';
import { ExecutionResponse } from './execution.response';
import { IRuleStore } from './store/rule.store.interfafce';
export declare class JasperEngine {
    private contextStore;
    private ruleStore;
    private readonly options;
    private logger;
    constructor(ruleStore: IRuleStore, options?: EngineOptions, logger?: Console);
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
