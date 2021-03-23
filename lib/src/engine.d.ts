import { Observable } from 'rxjs';
import { EngineOptions } from './engine.option';
import { ExecutionResponse } from './execution.response';
import { IRuleStore } from './store/rule.store.interfafce';
import { ILogger } from './ILogger';
export declare class JasperEngine {
    private contextStore;
    private ruleStore;
    private readonly options;
    private logger;
    constructor({ ruleStore, options, logger }: {
        ruleStore: IRuleStore;
        options?: EngineOptions;
        logger?: ILogger;
    });
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
