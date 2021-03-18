import { Observable, empty, of, from, forkJoin, throwError, concat, defer, combineLatest } from 'rxjs';
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
    private logger: any;

    constructor(ruleStore: Record<string, JasperRule>, options: EngineOptions = DefaultEngineOptions, logger = console) {
        this.options = options;
        this.contextStore = {};
        this.ruleStore = ruleStore;
        this.logger = logger;
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
            return from(params.action(params.context));
        }

        if (params.action instanceof Function) {
            return of(params.action(params.context));
        }

        return of(null);
    }

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
    private processExpression(
        expression: string | ((context: ExecutionContext) => any) | Observable<any>,
        context: ExecutionContext
    ): Observable<any[]> {
        if (typeof expression === 'string') {
            const jsonataExpression = jsonata(expression as string);
            const expressionObject = jsonataExpression.evaluate(context.root);
            return of(expressionObject).pipe(
                toArray(),
                map((arr) => {
                    return _.chain(_.flatten(arr))
                        .filter((expressionObject) => expressionObject)
                        .value();
                })
            );
        }

        if (expression instanceof Observable) {
            return (expression as Observable<any>).pipe(
                toArray(),
                map((arr) => {
                    return _.chain(_.flatten(arr))
                        .filter((expressionObject) => expressionObject)
                        .value();
                })
            );
        }

        if (expression instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) {
            return from(expression(context)).pipe(
                toArray(),
                map((arr) => {
                    return _.chain(_.flatten(arr))
                        .filter((expressionObject) => expressionObject)
                        .value();
                })
            );
        }

        if (expression instanceof Function) {
            return of(1).pipe(
                switchMap(() => {
                    try {
                        return of(expression(context));
                    } catch (error) {
                        return throwError(error);
                    }
                }),
                toArray(),
                map((arr) => {
                    return _.chain(_.flatten(arr))
                        .filter((expressionObject) => expressionObject)
                        .value();
                }),
            );
        }

        return of([]);
    }

    /**
     * Process a simple dependency
     * it will execute the path expression and for each match schedule an observables and add to the accumulator
     * @param accumulator a dictionar of tasks
     * @param compoundDependency the compound dependency object
     * @param context the current execution context
     */
    private processSimpleDependency(
        accumulator: Record<string, Observable<any>>,
        simpleDependency: SimpleDependency,
        context: ExecutionContext
    ): void {
        const registerMatchesHandler = this.processExpression(simpleDependency.path, context).subscribe(
            (pathObjects: any[]) => {
                _.each(pathObjects, (pathObject, index) => {
                    const simpleDependencyResponse: SimpleDependencyExecutionResponse = {
                        name: `${simpleDependency.name}`,
                        isSkipped: false,
                        rule: simpleDependency.rule,
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
                            simpleDependencyResponse.dependency = r.dependency;
                            simpleDependencyResponse.startDateTime = r.startDateTime;
                            simpleDependencyResponse.completedTime = r.completedTime;
                            if (this.options.debug) {
                                simpleDependencyResponse.debugContext = r.debugContext;
                                
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                simpleDependencyResponse.debugContext!.executionOrder = simpleDependency.executionOrder || ExecutionOrder.Parallel;
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                simpleDependencyResponse.debugContext!.whenDescription = simpleDependency.whenDescription;
                            }
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
                    debugContext: undefined,
                    error: err,
                    hasError: true,
                    isSuccessful: false,
                    result: null,
                };
                accumulator[`${simpleDependency.name}`] = of(errReponse);
            },
        );

        registerMatchesHandler.unsubscribe();
    }

    // TODO: further break down collectDependencyTasks into two methods

    /**
     * 
     * @param compoundDependency 
     * @param context 
     */
    private collectDependencyTasks(
        compoundDependency: CompoundDependency,
        context: ExecutionContext
    ): Record<string, Observable<SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse>> {
        const tasks: Record<
            string,
            Observable<SimpleDependencyExecutionResponse | CompoundDependencyExecutionResponse>
        > = _.reduce(
            compoundDependency.rules,
            (acc: Record<string, Observable<any>>, rule) => {
                if (isSimpleDependency(rule)) {
                    // process when clause
                    const whenSubscription = defer(() => {
                        return rule.when ? this.processExpression(rule.when, context).pipe(
                            switchMap(r => {
                                return of(_.get(r, '[0]', false));
                            }),
                        ) : of(true);
                    }).subscribe({
                        next: (x: boolean) => {
                            if (x) {
                                this.processSimpleDependency(acc, rule, context);
                            } else {
                                const skipped: SimpleDependencyExecutionResponse = {
                                    name: `${rule.name}`,
                                    isSkipped: true,
                                    rule: rule.rule,
                                    hasError: false,
                                    isSuccessful: true,
                                    result: null,
                                };
                                if (this.options.debug) {
                                    skipped.debugContext = {
                                        root: context.root,
                                        whenDescription: rule.whenDescription,
                                    };
                                }
                                acc[`${rule.name}`] = of(skipped);
                            }
                        },
                        error: (err) => {
                            const errorResponse: SimpleDependencyExecutionResponse = {
                                name: `${rule.name}`,
                                isSkipped: true,
                                rule: rule.rule,
                                error: err,
                                debugContext: undefined,
                                hasError: true,
                                isSuccessful: false,
                                result: null,
                            };
                            acc[`${rule.name}`] = of(errorResponse);
                        }
                    });

                    whenSubscription.unsubscribe();
                } else if (isCompoundDependency(rule)) {
                    const childCompoundDependency = rule as CompoundDependency;
                    const compoundDependencyResponse: CompoundDependencyExecutionResponse = {
                        name: childCompoundDependency.name,
                        hasError: false,
                        isSuccessful: false,
                        isSkipped: false,
                        rules: [],
                    };

                    const whenSubscription = defer(() => {
                        return rule.when ? this.processExpression(rule.when, context).pipe(
                            switchMap(r => {
                                return of(_.get(r, '[0]', false));
                            }),
                        ) : of(true);
                    }).subscribe({
                        next: (when: boolean) => {
                            if (when) {
                                acc[rule.name] = of(true).pipe(
                                    switchMap(() => {
                                        compoundDependencyResponse.startDateTime = moment.utc().toDate();
                                        return this.processCompoundDependency(childCompoundDependency, context);
                                    }),
                                    switchMap((r: CompoundDependencyExecutionResponse) => {
                                        compoundDependencyResponse.isSuccessful = r.isSuccessful;
                                        compoundDependencyResponse.rules = r.rules;
                                        compoundDependencyResponse.completedTime = r.completedTime;
                                        if (this.options.debug) {
                                            compoundDependencyResponse.debugContext = r.debugContext;
                                        }
            
                                        return of(compoundDependencyResponse);
                                    })
                                );
                            } else {
                                compoundDependencyResponse.isSkipped = true;
                                compoundDependencyResponse.isSuccessful = true;
                                if (this.options.debug) {
                                    compoundDependencyResponse.debugContext = {
                                        root: context.root,
                                        whenDescription: rule.whenDescription,
                                    };
                                }
                                acc[`${rule.name}`] = of(compoundDependencyResponse);
                            }
                        },
                        error: (err) => {
                            compoundDependencyResponse.hasError = true;
                            compoundDependencyResponse.error = err;
                            acc[`${rule.name}`] = of(compoundDependencyResponse);
                        }
                    });

                    whenSubscription.unsubscribe();
                }
                return acc;
            },
            {}
        );

        return tasks;
    }

    /**
     * Process a compound dependency
     * @param compoundDependency the compound dependency object
     * @param context the current execution context
     */
    private processCompoundDependency(
        compoundDependency: CompoundDependency,
        context: ExecutionContext
    ): Observable<CompoundDependencyExecutionResponse> {
        const operator = compoundDependency.operator || Operator.AND;
        const executionOrder = compoundDependency.executionOrder || ExecutionOrder.Parallel;

        const response: CompoundDependencyExecutionResponse = {
            name: compoundDependency.name,
            hasError: false,
            isSkipped: false,
            isSuccessful: false,
            rules: [],
            startDateTime: moment.utc().toDate(),
        };

        if (this.options.debug) {
            response.debugContext = {
                root: context.root,
                executionOrder,
                operator,
            }
        }

        const tasks = this.collectDependencyTasks(compoundDependency, context);

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

        const ruleHash = hash(params.ruleName);
        const objectHash = hash(params.root);
        const contextHash = ruleHash + objectHash;
        const contextId = `${contextHash}${ this.options.suppressDuplicateTasks ? '' : _.uniqueId('-')}`;
        let context: ExecutionContext = this.contextStore[contextId];

        if (!context || this.options.suppressDuplicateTasks === false) {
            context = {
                contextId,
                rule,
                root: params.root,
                _process$: empty(),
                complete: false,
                contextData: {},
            };

            if (this.options.debug) {
                context.contextData.objectHash = objectHash;
            }

            this.contextStore[contextId] = context;
            if (params.parentExecutionContext) {
                context.parentContext = params.parentExecutionContext;
                (params.parentExecutionContext.childrenContexts = params.parentExecutionContext.childrenContexts || {})[
                    context.contextId
                ] = context;
            }
        } else {
            return context._process$;
        }

        const response: ExecutionResponse = {
            rule: params.ruleName,
            hasError: false,
            isSuccessful: false,
            result: undefined,
            debugContext: this.options.debug ? 
            {
                contextId,
                root: context.root,
                ruleName: rule.name,
                parent: context?.parentContext?.root,
            } : undefined,
        };

        context._process$ = of(true).pipe(
            // call beforeAction
            tap(() => {
                response.startDateTime = moment.utc().toDate();
                if (rule.beforeAction) {
                    const subscription = this.processExpression(rule.beforeAction, context).subscribe(
                        () => {
                            if (this.options.debug) {
                                this.logger.debug(`before action executed for context ${context.contextId}`);
                            }
                        },
                        (error) => {
                            this.logger.error(error);
                        }
                    );
                    subscription.unsubscribe();
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
                    const subscription = from(rule.onError(err, context)).subscribe(
                        () => {
                            if (this.options.debug) {
                                this.logger.debug(`onError executed for context ${context.contextId}`);
                            }
                        },
                        (error) => {
                            this.logger.error(error);
                        }
                    );
                    subscription.unsubscribe();
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
                response.dependency = dependencyReponse;
            }),
            // call afterAction
            tap(() => {
                if (rule.afterAction) {
                    const subscription = this.processExpression(rule.afterAction, context).subscribe(
                        () => {
                            if (this.options.debug) {
                                this.logger.debug(`before action executed for context ${context.contextId}`);
                            }
                        },
                        (error) => {
                            this.logger.error(error);
                        }
                    );
                    subscription.unsubscribe();
                }
            }),
            switchMap(() => {
                return of(response);
            })
        );

        if (this.options.suppressDuplicateTasks) {
            context._process$ = context._process$.pipe(shareReplay(1));
        } else {
            context._process$ = context._process$.pipe(share());
        }

        return context._process$;
    }

    /* istanbul ignore next */
    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     */
    run(params: { root: any; ruleName: string }): Observable<ExecutionResponse> {
        return this.execute({ root: params.root, ruleName: params.ruleName });
    }
}
