import { Observable, empty, of, from, forkJoin, throwError, concat } from 'rxjs';
import { switchMap, tap, toArray, share, catchError, shareReplay, map } from 'rxjs/operators';
import {
    JasperRule,
    ExecutionContext,
    isSimpleDependency,
    SimpleDependency,
    Operator,
    isCompoundDependency,
    CompoundDependency,
    EngineOptions,
    DefaultEngineOptions,
    ExecutionOrder,
} from './rule.config';
import jsonata from 'jsonata';
import hash from 'object-hash';
import _ from 'lodash';
import {
    ExecutionResponse,
    CompoundDependencyExecutionResponse,
    SimpleDependencyExecutionResponse,
} from './execution.response';
import moment from 'moment';

/* istanbul ignore next */
// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = (async () => {}).constructor;
/* istanbul ignore next */
// eslint-disable-next-line require-yield
const GeneratorFunction = function* () {
    return {};
}.constructor;

export class JasperEngine {
    private contextStore: Record<string, ExecutionContext>;
    private ruleStore: Record<string, JasperRule>;
    private readonly options: EngineOptions;

    constructor(ruleStore: Record<string, JasperRule>, options: EngineOptions = DefaultEngineOptions) {
        this.options = options;
        this.contextStore = {};
        this.ruleStore = ruleStore;
    }

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
    private executeAction(params: {
        action: string | Observable<unknown> | ((obj: any) => any),
        context: ExecutionContext,
    }): Observable<any> {
        if (typeof params.action === 'string' || params.action instanceof String) {
            const expression = jsonata(params.action as string);
            return of(expression.evaluate(params.context.root));
        }

        if (params.action instanceof Observable) {
            return from(params.action);
        }

        if (params.action instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) {
            return from(params.action(params.context.root));
        }

        if (params.action instanceof Function) {
            return of(action(context.root));
        }

        return of(null);
    }

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
    private processPath(
        path: string | ((context: ExecutionContext) => any) | Observable<any>,
        context: ExecutionContext
    ): Observable<any[]> {
        if (typeof path === 'string') {
            const expression = jsonata(path as string);
            const pathObject = expression.evaluate(context.root);
            return of(pathObject).pipe(
                toArray(),
                map((arr) => {
                    return _.chain(_.flatten(arr))
                        .filter((pathObject) => pathObject)
                        .value();
                })
            );
        }

        if (path instanceof Observable) {
            return from(path).pipe(
                toArray(),
                map((arr) => {
                    return _.chain(_.flatten(arr))
                        .filter((pathObject) => pathObject)
                        .value();
                })
            );
        }

        if (path instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) {
            return from(path(context)).pipe(
                toArray(),
                map((arr) => {
                    return _.chain(_.flatten(arr))
                        .filter((pathObject) => pathObject)
                        .value();
                })
            );
        }

        if (path instanceof Function) {
            return of(path(context)).pipe(
                toArray(),
                map((arr) => {
                    return _.chain(_.flatten(arr))
                        .filter((pathObject) => pathObject)
                        .value();
                })
            );
        }

        return of([]);
    }

    /* istanbul ignore next */
    private processSimpleDependency(
        accumulator: Record<string, Observable<any>>,
        simpleDependency: SimpleDependency,
        context: ExecutionContext
    ): void {
        const registerMatchesHandler = this.processPath(simpleDependency.path, context).subscribe(
            (pathObjects: any[]) => {
                _.each(pathObjects, (pathObject, index) => {
                    const simpleDependencyResponse: SimpleDependencyExecutionResponse = {
                        name: `${simpleDependency.name}`,
                        isSkipped: false,
                        rule: simpleDependency.rule,
                        executionOrder: simpleDependency.executionOrder || ExecutionOrder.Parallel,
                        hasError: false,
                        isSuccessful: false,
                        result: null,
                        index,
                    };

                    const task = of(pathObject).pipe(
                        switchMap((pathObject: any) => {
                            simpleDependencyResponse.startDateTime = moment.utc().toDate();
                            return this.execute({
                                root: pathObject,
                                ruleName: simpleDependency.rule,
                                parentExecutionContext: context,
                            });
                        }),
                        switchMap((r: ExecutionResponse) => {
                            simpleDependencyResponse.result = r.result;
                            simpleDependencyResponse.isSuccessful = r.isSuccessful;
                            simpleDependencyResponse.dependencies = r.dependencies;
                            simpleDependencyResponse.completedTime = r.completedTime;
                            return of(simpleDependencyResponse);
                        }),
                        catchError((err) => {
                            simpleDependencyResponse.error = err;
                            simpleDependencyResponse.hasError = true;
                            simpleDependencyResponse.isSuccessful = false;
                            simpleDependencyResponse.completedTime = moment.utc().toDate();
                            return of(simpleDependencyResponse);
                        })
                    );

                    accumulator[`${simpleDependency.name}-${index}`] = task;
                });
            },
            (err) => {
                const errReponse: SimpleDependencyExecutionResponse = {
                    name: `${simpleDependency.name}`,
                    isSkipped: false,
                    rule: simpleDependency.rule,
                    executionOrder: simpleDependency.executionOrder || ExecutionOrder.Parallel,
                    error: err,
                    hasError: true,
                    isSuccessful: false,
                    result: null,
                };
                accumulator[`${simpleDependency.name}`] = of(errReponse);
            }
        );

        registerMatchesHandler.unsubscribe();
    }

    /* istanbul ignore next */
    private processCompoundDependency(
        compoundDependency: CompoundDependency,
        context: ExecutionContext
    ): Observable<CompoundDependencyExecutionResponse> {
        const operator = compoundDependency.operator || Operator.AND;
        const executionOrder = compoundDependency.executionOrder || ExecutionOrder.Parallel;

        const response: CompoundDependencyExecutionResponse = {
            name: compoundDependency.name,
            hasError: false,
            isSuccessful: false,
            operator,
            executionOrder: compoundDependency.executionOrder || ExecutionOrder.Parallel,
            rules: [],
            startDateTime: moment.utc().toDate(),
        };

        const tasks: Record<
            string,
            Observable<SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse>
        > = _.reduce(
            compoundDependency.rules,
            (acc: Record<string, Observable<any>>, rule) => {
                if (isSimpleDependency(rule)) {
                    this.processSimpleDependency(acc, rule, context);
                } else if (isCompoundDependency(rule)) {
                    const childCompoundDependency = rule as CompoundDependency;
                    const compoundDependencyResponse: CompoundDependencyExecutionResponse = {
                        name: childCompoundDependency.name,
                        hasError: false,
                        isSuccessful: false,
                        operator,
                        executionOrder: childCompoundDependency.executionOrder || ExecutionOrder.Parallel,
                        rules: [],
                    };

                    acc[rule.name] = of(true).pipe(
                        switchMap(() => {
                            compoundDependencyResponse.startDateTime = moment.utc().toDate();
                            return this.processCompoundDependency(childCompoundDependency, context);
                        }),
                        switchMap((r: CompoundDependencyExecutionResponse) => {
                            compoundDependencyResponse.isSuccessful = r.isSuccessful;
                            compoundDependencyResponse.rules = r.rules;
                            compoundDependencyResponse.completedTime = r.completedTime;

                            return of(compoundDependencyResponse);
                        })
                    );
                }
                return acc;
            },
            {}
        );

        const values = _.values(tasks);
        // let counter = 0;

        const runTask: Observable<(SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse)[]> =
            executionOrder === ExecutionOrder.Parallel
                ? forkJoin(tasks).pipe(
                      map(
                          (
                              results: Record<
                                  string,
                                  SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse
                              >
                          ) => {
                              const entries = _.entries(results).map(([, result]) => result);
                              response.rules = _.map(
                                  entries,
                                  (result: SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse) =>
                                      result
                              );

                              return entries;
                          }
                      )
                  )
                : concat(...values).pipe(
                      tap((result) => {
                          response.rules.push(result);
                          // counter ++;
                      }),
                      toArray()
                  );

        return runTask.pipe(
            switchMap((results: (SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse)[]) => {
                response.completedTime = moment.utc().toDate();
                response.hasError = _.some(
                    results,
                    (result: SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse) => {
                        return result.hasError;
                    }
                );

                response.isSuccessful =
                    operator === Operator.AND
                        ? _.every(
                              results,
                              (result: SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse) =>
                                  result.isSuccessful
                          )
                        : _.some(
                              results,
                              (result: SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse) =>
                                  result.isSuccessful
                          );
                return of(response);
            })
        );
    }

    /* istanbul ignore next */
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
                options: this.options,
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
            startDateTime: moment.utc().toDate(),
        };

        context.process = of(true).pipe(
            // call beforeAction
            tap(() => {
                if (rule.beforeAction) {
                    if (
                        rule.beforeAction instanceof AsyncFunction &&
                        AsyncFunction !== Function &&
                        AsyncFunction !== GeneratorFunction
                    ) {
                        const subscription = from(rule.beforeAction(context)).subscribe(
                            // eslint-disable-next-line @typescript-eslint/no-empty-function
                            () => {},
                            (error) => {
                                console.error(error);
                            }
                        );
                        subscription.unsubscribe();
                    } else if (rule.beforeAction instanceof Function) {
                        try {
                            rule.beforeAction(context);
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
            }),
            // execute the main action
            switchMap(() => {
                return this.executeAction({
                    action: rule.action,
                    context,
                });
            }),
            tap((result) => {
                context.complete = true;
                response.isSuccessful = true;
                response.result = result;
                response.completedTime = moment.utc().toDate();
            }),
            catchError((err) => {
                response.isSuccessful = false;
                response.hasError = true;
                response.error = err;
                response.completedTime = moment.utc().toDate();
                if (rule.onError) {
                    if (
                        (rule.onError instanceof AsyncFunction &&
                            AsyncFunction !== Function &&
                            AsyncFunction !== GeneratorFunction) === true
                    ) {
                        const subscription = from(rule.onError(err, context)).subscribe(
                            // eslint-disable-next-line @typescript-eslint/no-empty-function
                            () => {},
                            (error) => {
                                console.error(error);
                            }
                        );

                        subscription.unsubscribe();
                    } else if (rule.onError instanceof Function) {
                        try {
                            rule.onError(err, context);
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }

                return throwError(err);
            }),
            // call dependency rules
            switchMap(() => {
                if (rule.dependencies && rule.dependencies.rules && rule.dependencies.rules.length) {
                    return this.processCompoundDependency(rule.dependencies, context);
                }

                return of(undefined);
            }),
            tap((dependencyReponse) => {
                response.dependencies = dependencyReponse;
            }),
            // call afterAction
            tap(() => {
                if (rule.afterAction) {
                    if (
                        (rule.afterAction instanceof AsyncFunction &&
                            AsyncFunction !== Function &&
                            AsyncFunction !== GeneratorFunction) === true
                    ) {
                        const subscription = from(rule.afterAction(context)).subscribe(
                            // eslint-disable-next-line @typescript-eslint/no-empty-function
                            () => {},
                            (error) => {
                                console.error(error);
                            }
                        );

                        subscription.unsubscribe();
                    } else if (rule.afterAction instanceof Function) {
                        try {
                            rule.afterAction(context);
                        } catch (error) {
                            console.error(error);
                        }
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

    /* istanbul ignore next */
    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     */
    run(params: { root: any; ruleName: string }): Observable<ExecutionResponse> {
        return this.execute(params);
    }
}
