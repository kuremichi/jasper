import { Observable, of, from, concat } from 'rxjs';
import {
    switchMap,
    tap,
    toArray,
    share,
    catchError,
    shareReplay,
    map,
    switchMapTo,
    mergeAll,
} from 'rxjs/operators';
import jsonata from 'jsonata';
import hash from 'object-hash';
import _ from 'lodash';

import moment from 'moment';
import { ExecutionContext } from './execution.context';
import { JasperRule } from './jasper.rule';
import { DefaultEngineOptions, EngineOptions } from './engine.option';
import { isSimpleDependency, SimpleDependency } from './dependency/simple.dependency';
import { ExecutionOrder, JasperEngineRecipe, Operator } from './enum';
import { CompositeDependency } from './dependency/composite.dependency';
import { SimpleDependencyResponse } from './dependency/simple.dependency.response';
import { CompositeDependencyResponse } from './dependency/composite.dependency.response';
import { ExecutionResponse } from './execution.response';
import { SimpleDependencyExecutionResponse } from './dependency/simple.dependency.execution.response';

export class JasperEngine {
    private contextStore: Record<string, ExecutionContext>;
    private ruleStore: Record<string, JasperRule>;
    private readonly options: EngineOptions;
    private logger: any;

    /**
     *
     * @param ruleStore a dictionary of all rules
     * @param options options
     * @param logger logger
     */
    constructor(
        ruleStore: Record<string, JasperRule>,
        options: EngineOptions = DefaultEngineOptions,
        logger = console
    ) {
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
        action: string | ((context: ExecutionContext) => Observable<any>);
        context: ExecutionContext;
    }): Observable<any> {
        if (typeof params.action === 'string' || params.action instanceof String) {
            const expression = jsonata(params.action as string);
            const result = expression.evaluate(params.context.root);
            return of(result);
        }

        if (params.action instanceof Observable) {
            return from(params.action);
        }

        if (params.action instanceof Function) {
            return params.action(params.context) as Observable<any>;
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
        expression: string | ((context: ExecutionContext) => Observable<any>),
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

        if (expression instanceof Function) {
            return expression(context).pipe(
                toArray(),
                map((arr) => {
                    return _.chain(_.flatten(arr))
                        .filter((expressionObject) => expressionObject)
                        .value();
                })
            );
        }

        return of([]);
    }

    /**
     * Process a composite dependency
     * @param compositeDependency 
     * @param context 
     * @returns
     * the execution response for the composite dependency
     */
    private processCompositeDependency(
        compositeDependency: CompositeDependency,
        context: ExecutionContext
    ) : Observable<CompositeDependencyResponse> {
        const operator = compositeDependency.operator || Operator.AND;
        const executionOrder = compositeDependency.executionOrder || ExecutionOrder.Parallel;

        const dependencyResponse: CompositeDependencyResponse = {
            name: compositeDependency.name,
            hasError: false,
            errors: [],
            isSkipped: false,
            isSuccessful: true,
            rules: [],
            startTime: moment.utc().toDate(),
        };

        /* istanbul ignore next */
        if (this.options.debug) {
            dependencyResponse.debugContext = {
                root: context.root,
                executionOrder,
                operator,
            };
        }

        return (compositeDependency.when
            ? this.processExpression(compositeDependency.when, context).pipe(
                  switchMap((whenResult) => {
                      const w: boolean = _.get(whenResult, '[0]', false);
                      return of(w);
                  })
              )
            : of(true)
        ).pipe(
            switchMap((run: boolean) => {
                dependencyResponse.isSkipped = !run;
                if (dependencyResponse.isSkipped) {
                    /* istanbul ignore next */
                    if (this.options.debug) {
                        dependencyResponse.debugContext = {
                            root: context.root,
                            whenDescription: compositeDependency.whenDescription,
                        };
                    }

                    return of(dependencyResponse);
                }

                // before dependency
                return (
                    compositeDependency.beforeDependency
                    ? compositeDependency.beforeDependency(context)
                    : of(null)
                ).pipe(
                    // run dependency
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    switchMap((beforeDependencyResult) => {
                        const tasks = _.map(compositeDependency.rules, rule => {
                            if (isSimpleDependency(rule)) {
                                return this.processSimpleDependency(
                                    rule,
                                    context,
                                );
                            }

                            return this.processCompositeDependency(
                                rule,
                                context,
                            );
                        });

                        return (
                            executionOrder == ExecutionOrder.Sequential
                            ? concat(...tasks).pipe(
                                toArray(),
                            )
                            : from(tasks).pipe(
                                mergeAll(compositeDependency.maxCurrency),
                                toArray(),
                            )
                        ).pipe(
                            switchMap((responses: (SimpleDependencyResponse | CompositeDependencyResponse)[]) => {
                                dependencyResponse.rules = responses;
                                return of(dependencyResponse);
                            }),
                        );
                    }),
                    // after dependency
                    switchMap(() => {
                        return (
                            compositeDependency.afterDependency
                            ? compositeDependency.afterDependency(context)
                            : of(null)
                        )
                    }),
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    switchMap((afterDependencyResult) => {
                        dependencyResponse.isSuccessful =
                            operator === Operator.AND
                                ? _.every(
                                    dependencyResponse.rules,
                                    (result: SimpleDependencyResponse | CompositeDependencyResponse) =>
                                        result.isSuccessful
                                )
                                : _.some(
                                    dependencyResponse.rules,
                                    (result: SimpleDependencyResponse | CompositeDependencyResponse) =>
                                        result.isSuccessful
                                );
                        dependencyResponse.hasError = !dependencyResponse.isSuccessful;
                        return of(dependencyResponse);
                    }),
                )
            }),
            catchError(err => {
                dependencyResponse.hasError = true;
                dependencyResponse.errors.push(err);
                dependencyResponse.isSuccessful = false;

                return compositeDependency.onDependencyError
                ? compositeDependency.onDependencyError(err, dependencyResponse, context)
                : of(dependencyResponse);
            }),
        );
    }

    /**
     * Process a simple dependency
     * it will execute the path expression and for each match schedule an observables and add to the accumulator
     * @param simpleDependency 
     * @param context the current execution context
     * @returns 
     */
    private processSimpleDependency(
        simpleDependency: SimpleDependency,
        context: ExecutionContext
    ): Observable<SimpleDependencyResponse> {
        const dependencyResponse: SimpleDependencyResponse = {
            name: `${simpleDependency.name}`,
            isSkipped: false,
            rule: simpleDependency.rule,
            hasError: false,
            isSuccessful: true,
            errors: [],
            matches: [],
        };

        return (simpleDependency.when
            ? this.processExpression(simpleDependency.when, context).pipe(
                  switchMap((whenResult) => {
                      const w: boolean = _.get(whenResult, '[0]', false);
                      return of(w);
                  })
              )
            : of(true)
        ).pipe(
            switchMap(run => {
                dependencyResponse.isSkipped = !run;
                if (dependencyResponse.isSkipped) {
                    /* istanbul ignore next */
                    if (this.options.debug) {
                        dependencyResponse.debugContext = {
                            root: context.root,
                            whenDescription: simpleDependency.whenDescription,
                        };
                    }

                    return of(dependencyResponse);
                }

                return (simpleDependency.beforeDependency ? simpleDependency.beforeDependency(context) : of(null)).pipe(
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    switchMap((beforeDependencyResult: any) => {
                        return this.processExpression(simpleDependency.path, context).pipe(
                            switchMap((pathObjects: any[]) => {
                                const executeOrder = simpleDependency.executionOrder || ExecutionOrder.Parallel;

                                const tasks = _.map(pathObjects, (pathObject, index) => {
                                    const executionResponse: SimpleDependencyExecutionResponse = {
                                        name: `${simpleDependency.name}`,
                                        rule: simpleDependency.rule,
                                        hasError: false,
                                        isSuccessful: true,
                                        index,
                                        result: undefined,
                                    };

                                    const task = of(pathObject).pipe(
                                        // before each match
                                        switchMap((pathObject: any) => {
                                            executionResponse.startTime = moment.utc().toDate();
                                            return simpleDependency.beforeEach ?
                                                simpleDependency.beforeEach(pathObject, index, context) : 
                                                of(null);
                                        }),
                                        // execute
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                        switchMap((beforeEachResult: any) => {
                                            return this.execute({
                                                root: pathObject,
                                                ruleName: simpleDependency.rule,
                                                parentExecutionContext: context,
                                            });
                                        }),
                                        tap((r: ExecutionResponse) => {
                                            _.merge(executionResponse, r);
                                            /* istanbul ignore next */
                                            if (this.options.debug) {
                                                executionResponse.debugContext = r.debugContext;

                                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                                executionResponse.debugContext!.executionOrder =
                                                    simpleDependency.executionOrder || ExecutionOrder.Parallel;
                                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                                executionResponse.debugContext!.whenDescription =
                                                    simpleDependency.whenDescription;
                                            }
                                        }),
                                        switchMap((response: ExecutionResponse) => {
                                            if (executionResponse.hasError && executionResponse.error && simpleDependency.onEachError) {
                                                return simpleDependency.onEachError(response.error, executionResponse, context);
                                            }

                                            return of(dependencyResponse);
                                        }),
                                        // after each match
                                        switchMap(() => {
                                            return simpleDependency.afterEach ?
                                                simpleDependency.afterEach(pathObject, index, context).pipe(
                                                    switchMapTo(of(executionResponse)),
                                                ) :
                                                of(executionResponse);
                                        }),
                                        tap(() => {
                                            executionResponse.completeTime = moment.utc().toDate();
                                            dependencyResponse.matches.push(executionResponse);
                                        }),
                                        catchError((err) => {
                                            executionResponse.hasError = true;
                                            executionResponse.error = err;
                                            executionResponse.isSuccessful = false;
                                            executionResponse.completeTime = moment.utc().toDate();
                                            return of(executionResponse);
                                        }),
                                    );
                                    return task;
                                });

                                return executeOrder == ExecutionOrder.Sequential
                                    ? concat(...tasks).pipe(
                                        toArray(),
                                    )
                                    : from(tasks).pipe(
                                        mergeAll(simpleDependency.maxCurrency),
                                        toArray(),
                                    );
                            }),
                            switchMap((responses: SimpleDependencyExecutionResponse[]) => {
                                return (
                                    simpleDependency.afterDependency
                                    ? simpleDependency.afterDependency(context).pipe(
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                        switchMap(afterDependencyResult => {
                                            return of(responses);
                                        }),
                                    )
                                    : of(responses)
                                ).pipe(
                                    switchMap((responses: SimpleDependencyExecutionResponse[]) => {
                                        dependencyResponse.completeTime = moment.utc().toDate();
                                        const executionErrors = _.chain(responses)
                                            .filter(response => response.hasError && response.error)
                                            .map(response => response.error)
                                            .value();

                                        dependencyResponse.errors = _.concat(dependencyResponse.errors, executionErrors);
                                        dependencyResponse.hasError = dependencyResponse.errors.length > 0;
                                        dependencyResponse.isSuccessful = _.every(responses, response => response.isSuccessful);
                                        
                                        dependencyResponse.matches = _.orderBy(dependencyResponse.matches, ['index'], ['asc']);
                                        return of(dependencyResponse);
                                    }),
                                );
                            })
                        );
                    }),
                );
            }),
            catchError((err) => { 
                dependencyResponse.hasError = true;
                dependencyResponse.isSuccessful = false;
                dependencyResponse.completeTime = moment.utc().toDate();

                return simpleDependency.onDependencyError
                    ? simpleDependency.onDependencyError(err, dependencyResponse, context)
                    : of(dependencyResponse).pipe(
                        tap(dependencyResponse => {
                            // push the error by default
                            // for custom handled, the onDependencyError handler
                            // should make a decision whether it should be pushed.
                            dependencyResponse.errors.push(err);
                        }),
                    );
            }),
        );
    }

    /**
     * execute the root object against a rule
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
        const objectHash = hash(rule.uniqueBy ? rule.uniqueBy(params.root) : params.root);
        const contextHash = ruleHash + objectHash;
        
        const dedupId = this.options.suppressDuplicateTasks ? '' : `-${_.random(0, 10000)}`;
        const contextId = `${contextHash}${dedupId}`;

        let context: ExecutionContext = this.contextStore[contextId];

        if (!context || this.options.suppressDuplicateTasks === false) {
            context = {
                contextId,
                rule,
                root: params.root,
                _process$: of(null),
                complete: false,
                contextData: {},
                response: {
                    rule: params.ruleName,
                    hasError: false,
                    isSuccessful: false,
                    result: undefined,
                    debugContext: this.options.debug
                        ? {
                              contextId,
                              root: params.root,
                              ruleName: rule.name,
                          }
                        : undefined,
                },
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

        const response = context.response;

        context._process$ = of(true).pipe(
            // call beforeAction
            switchMap((x) => {
                response.startTime = moment.utc().toDate();
                if (rule.beforeAction) {
                    return rule.beforeAction(context).pipe(
                        tap(() => {
                            /* istanbul ignore next */
                            if (this.options.debug) {
                                this.logger.debug(
                                    `before action executed for rule ${rule.name} - context ${context.contextId}`
                                );
                            }
                        })
                    );
                }
                return of(x);
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
                response.completeTime = moment.utc().toDate();
            }),
            // call dependency rules
            switchMap(() => {
                return rule.dependencies 
                    ? this.processCompositeDependency(rule.dependencies, context).pipe(
                        tap((dependencyResponse: CompositeDependencyResponse) => {
                            response.dependency = dependencyResponse;
                            response.isSuccessful = response.isSuccessful && dependencyResponse.isSuccessful;
                        }),
                        switchMapTo(of(response)),
                    )
                    : of(response);
            }),
            // call afterAction
            switchMap((response) => {
                // validation recipe expect the result for the rule to be boolean
                // and in order for the rule to be valid, the result needs to true
                if (this.options.recipe === JasperEngineRecipe.ValidationRuleEngine) {
                    response.isSuccessful = response.isSuccessful && response.result === true;
                }

                if (rule.afterAction) {
                    return rule.afterAction(context).pipe(
                        tap(() => {
                            /* istanbul ignore next */
                            if (this.options.debug) {
                                this.logger.debug(
                                    `after action executed for rule ${rule.name} - context ${context.contextId}`
                                );
                            }
                        })
                    );
                }
                return of(response);
            }),
            catchError((err) => {
                response.isSuccessful = false;
                response.hasError = true;
                response.error = err;
                response.completeTime = moment.utc().toDate();
                if (rule.onError) {
                    /* if a custom onError handler is specified
                       let it decide if we should replace the the stream 
                       or let it fail
                    */
                    return rule.onError(err, context).pipe(
                        tap(() => {
                            /* istanbul ignore next */
                            if (this.options.debug) {
                                this.logger.debug(
                                    `onError executed for rule ${rule.name} - context ${context.contextId}`
                                );
                            }
                        })
                    );
                }

                return of(response);
            }),
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
