import { JasperEngineRecipe } from './recipe';
import { Observable, empty, of, from, forkJoin, throwError } from 'rxjs';
import { switchMap, tap, toArray, share, catchError, shareReplay } from 'rxjs/operators';
import {
    JasperRule,
    ExecutionContext,
    isSimpleDependency,
    SimpleDependency,
    Operator,
    isCompoundDependency,
    CompoundDependency,
} from './rule.config';
import jsonata from 'jsonata';
import hash from 'object-hash';
import _ from 'lodash';
import { ExecutionResponse, CompoundDependencyExecutionResponse, SimpleDependencyExecutionResponse } from './execution.response';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = (async () => {}).constructor;
// eslint-disable-next-line require-yield
const GeneratorFunction = function* () {
    return {};
}.constructor;

export class JasperEngine {
    private contextStore: Record<string, ExecutionContext>;
    private ruleStore: Record<string, JasperRule>;
    private options: EngineOptions;

    constructor(ruleStore: Record<string, JasperRule>, options: EngineOptions = DefaultEngineOptions) {
        this.options = options;
        this.contextStore = {};
        this.ruleStore = ruleStore;
    }

    private executeAction({
        context,
        action,
    }: {
        context: ExecutionContext;
        action: string | Observable<unknown> | ((obj: any) => any);
    }): Observable<any> {
        if (typeof action === 'string' || action instanceof String) {
            const expression = jsonata(action as string);
            return of(expression.evaluate(context.root));
        } 
        
        if (action instanceof Observable) {
            return from(action).pipe(toArray());
        } 
        
        if (action instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) {
            return from(action(context.root));
        } 
        
        if (action instanceof Function) {
            return of(action(context.root));
        }

        return of(null);
    }

    private processPath(context: ExecutionContext, path: string | ((context: ExecutionContext) => any)): Observable<any[]> {
        if (typeof path === 'string') {
            const expression = jsonata(path as string);
            const pathObject = expression.evaluate(context.root);
            return of(pathObject).pipe(
                toArray(),
            );
        }

        // if (path instanceof Observable) {
        //     return from(path).pipe(toArray());
        // }

        if (path instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) {
            return from(path(context)).pipe(
                toArray(),
            );
        } 
        
        if (path instanceof Function) {
            return of(path(context)).pipe(
                toArray(),
            );
        }

        return of([]);
    }

    private processCompoundDependency(context: ExecutionContext, compoundDependency: CompoundDependency): Observable<CompoundDependencyExecutionResponse> {
        const operator = compoundDependency.operator || Operator.AND;

        const response: CompoundDependencyExecutionResponse = {
            name: compoundDependency.name,
            hasError: false,
            isSuccessful: false,
            operator,
            rules: [],
        };

        const tasks: Record<string, Observable<ExecutionResponse>> = _.reduce(
            compoundDependency.rules,
            (acc: any, rule) => {
                if (isSimpleDependency(rule)) {
                    const simpleDependency = rule as SimpleDependency;
                    const simpleDependencyResponse: SimpleDependencyExecutionResponse = {
                        name: rule.name,
                        isSkipped: false,
                        rule: rule.rule,
                        hasError: false,
                        isSuccessful: false,
                        result: null,
                        dependencies: undefined,
                    }

                    const task = this.processPath(context, rule.path).pipe(
                        switchMap((pathObjects: any[]) => {
                            // TODO: consume every path object
                            return this.execute({
                                root: pathObjects[0],
                                ruleName: simpleDependency.rule,
                                parentExecutionContext: context,
                            });
                        }),
                        switchMap((r: ExecutionResponse) => {
                            simpleDependencyResponse.result = r.result;
                            simpleDependencyResponse.isSuccessful = r.isSuccessful;
                            simpleDependencyResponse.dependencies = r.dependencies;
                            return of(simpleDependencyResponse);
                        }),
                        catchError((err) => {
                            simpleDependencyResponse.error = err;
                            simpleDependencyResponse.hasError = true;
                            simpleDependencyResponse.isSuccessful = false;
                            return of(simpleDependencyResponse);
                        }),
                    );

                    acc[rule.name] = task;
                } else if (isCompoundDependency(rule)) {
                    const childCompoundDependency = rule as CompoundDependency;
                    const compoundDependencyResponse: CompoundDependencyExecutionResponse = {
                        name: childCompoundDependency.name,
                        hasError: false,
                        isSuccessful: false,
                        operator,
                        rules: [],
                    };

                    acc[rule.name] = this.processCompoundDependency(context, childCompoundDependency).pipe(
                        switchMap((r: CompoundDependencyExecutionResponse) => {
                            compoundDependencyResponse.isSuccessful = r.isSuccessful;
                            compoundDependencyResponse.rules = r.rules;

                            return of(compoundDependencyResponse);
                        }),
                    );
                }
                return acc;
            },
            {}
        );

        return forkJoin(tasks).pipe(
            switchMap((results: Record<string, SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse>) => {
                const entries = _.entries(results);

                response.hasError = _.some(entries, ([, result]: [string, SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse]) => {
                    return result.hasError;
                });

                response.isSuccessful =
                    operator === Operator.AND
                        ? _.every(entries, ([, result]: [string, SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse]) => result.isSuccessful)
                        : _.some(entries, ([, result]: [string, SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse]) => result.isSuccessful);

                response.rules = _.map(entries, ([, result]: [string, SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse]) => result);
                return of(response);
            }),
        );
    }

    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     * @param params.parentExecutionContext [parent execution context] the parent context of current context
     */
    private execute(params: {
        root: any;
        ruleName: string;
        parentExecutionContext?: ExecutionContext;
    }): Observable<ExecutionResponse> {
        const rule: JasperRule = this.ruleStore[params.ruleName];

        const contextId = `${params.ruleName}-${hash(params.root)}`;
        let context: ExecutionContext = this.contextStore[contextId];

        if (!context) {
            context = {
                contextId,
                rule,
                root: params.root,
                process: empty(),
                complete: false,
            };

            console.debug(`adding context ${contextId}`);

            this.contextStore[contextId] = context;
            if (params.parentExecutionContext) {
                context.parentContext = params.parentExecutionContext;
                (params.parentExecutionContext.childrenContexts = params.parentExecutionContext.childrenContexts || {})[
                    context.contextId
                ] = context;
            }
        } else {
            return context.process;
        }

        const response: ExecutionResponse = {
            rule: params.ruleName,
            hasError: false,
            isSuccessful: false,
            result: undefined,
        };

        context.process = of(true).pipe(
            tap(() => {
                if (rule.beforeAction) {
                    if (
                        rule.beforeAction instanceof AsyncFunction &&
                        AsyncFunction !== Function &&
                        AsyncFunction !== GeneratorFunction
                    ) {
                        const subscription = from(rule.beforeAction(context)).subscribe(
                            (x) => {
                                console.log(x);
                            },
                            (e) => {
                                console.log(e);
                            }
                        );

                        subscription.unsubscribe();
                    } else if (rule.beforeAction instanceof Function) {
                        rule.beforeAction(context);
                    }
                }
            }),
            switchMap(() => {
                return this.executeAction({
                    context,
                    action: rule.action,
                }).pipe();
            }),
            tap((result) => {
                context.complete = true;
                response.isSuccessful = true;
                response.result = result;
            }),
            catchError((err) => {
                response.isSuccessful = false;
                response.hasError = true;
                response.error = err;
                /*
                    if the 'root' is always evaluated before the dependencies.
                */
                // TODO: call error callback
                return throwError(err);
            }),
            switchMap(() => {
                if (rule.dependencies && rule.dependencies.rules && rule.dependencies.rules.length) {
                    return this.processCompoundDependency(context, rule.dependencies);
                }

                return of(undefined);
            }),
            tap((dependencyReponse) => {
                response.dependencies = dependencyReponse;
            }),
            tap(() => {
                if (rule.afterAction) {
                    if (
                        (rule.afterAction instanceof AsyncFunction &&
                            AsyncFunction !== Function &&
                            AsyncFunction !== GeneratorFunction) === true
                    ) {
                        const subscription = from(rule.afterAction(context)).subscribe(
                            (x) => {
                                console.log(x);
                            },
                            (e) => {
                                console.log(e);
                            }
                        );

                        subscription.unsubscribe();
                    } else if (rule.afterAction instanceof Function) {
                        rule.afterAction(context);
                    }
                }
            }),
            switchMap(() => {
                return of(response);
            })
        );

        if (this.options.suppressDuplicateTasks) {
            context.process = context.process.pipe(shareReplay(1));
        } else {
            context.process = context.process.pipe(share());
        }

        return context.process;
    }

    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     */
    run(params: {
        root: any;
        ruleName: string;
    }): Observable<ExecutionResponse> {
        return this.execute(params)
    }
}

export interface EngineOptions {
    suppressDuplicateTasks: boolean;
    recipe: JasperEngineRecipe;
}

export const DefaultEngineOptions: EngineOptions = {
    suppressDuplicateTasks: true,
    recipe: JasperEngineRecipe.ValidationRuleEngine,
};
