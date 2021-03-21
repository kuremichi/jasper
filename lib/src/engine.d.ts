import { Observable } from 'rxjs';
import { JasperRule } from './jasper.rule';
import { EngineOptions } from './engine.option';
import { ExecutionResponse } from './execution.response';
export declare class JasperEngine {
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
