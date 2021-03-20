import { Observable, empty, of, from, forkJoin, throwError, concat, defer, iif } from 'rxjs';
import {
    switchMap,
    tap,
    toArray,
    share,
    catchError,
    shareReplay,
    map,
    mapTo,
    concatAll,
    switchMapTo,
    mergeAll,
} from 'rxjs/operators';
import jsonata from 'jsonata';
import hash from 'object-hash';
import _, { values } from 'lodash';

import moment from 'moment';
import { ExecutionContext } from './execution.context';
import { JasperRule } from './jasper.rule';
import { DefaultEngineOptions, EngineOptions } from './engine.option';
import { isSimpleDependency, SimpleDependency } from './dependency/simple.dependency';
import { ExecutionOrder, Operator } from './enum';
import { CompositeDependency, isCompositeDependency } from './dependency/composite.dependency';
import { SimpleDependencyResponse } from './dependency/simple.dependency.response';
import { CompositeDependencyExecutionResponse } from './dependency/composite.dependency.response';
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
        action: string | Observable<unknown> | ((context: ExecutionContext) => Observable<any>);
        context: ExecutionContext;
    }): Observable<any> {
        if (typeof params.action === 'string' || params.action instanceof String) {
            const expression = jsonata(params.action as string);
            return of(expression.evaluate(params.context.root));
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
     * Process a simple dependency
     * it will execute the path expression and for each match schedule an observables and add to the accumulator
     * @param accumulator a dictionary of tasks
     * @param compositeDependency the compound dependency object
     * @param context the current execution context
     */
    // private processSimpleDependency(
    //     accumulator: Record<string, Observable<any>>,
    //     simpleDependency: SimpleDependency,
    //     context: ExecutionContext
    // ): void {
    //     const registerMatchesHandler = of(1)
    //         .pipe(
    //             tap(() => {
    //                 if (simpleDependency.beforeDependency) {
    //                     accumulator[`${simpleDependency.name}-beforeDependency`] = simpleDependency.beforeDependency(
    //                         context
    //                     );
    //                 }
    //             }),
    //             switchMap(() => {
    //                 return this.processExpression(simpleDependency.path, context).pipe(
    //                     tap((pathObjects: any[]) => {
    //                         _.each(pathObjects, (pathObject, index) => {
    //                             const simpleDependencyResponse: SimpleDependencyExecutionResponse = {
    //                                 name: `${simpleDependency.name}`,
    //                                 isSkipped: false,
    //                                 rule: simpleDependency.rule,
    //                                 hasError: false,
    //                                 isSuccessful: false,
    //                                 result: null,
    //                                 index,
    //                             };

    //                             const task = of(pathObject).pipe(
    //                                 switchMap((pathObject: any) => {
    //                                     simpleDependencyResponse.startDateTime = moment.utc().toDate();
    //                                     return this.execute({
    //                                         root: pathObject,
    //                                         ruleName: simpleDependency.rule,
    //                                         parentExecutionContext: context,
    //                                     });
    //                                 }),
    //                                 switchMap((r: ExecutionResponse) => {
    //                                     simpleDependencyResponse.result = r.result;
    //                                     simpleDependencyResponse.isSuccessful = r.isSuccessful;
    //                                     simpleDependencyResponse.dependency = r.dependency;
    //                                     simpleDependencyResponse.startDateTime = r.startDateTime;
    //                                     simpleDependencyResponse.completedTime = r.completedTime;
    //                                     /* istanbul ignore next */
    //                                     if (this.options.debug) {
    //                                         simpleDependencyResponse.debugContext = r.debugContext;

    //                                         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    //                                         simpleDependencyResponse.debugContext!.executionOrder =
    //                                             simpleDependency.executionOrder || ExecutionOrder.Parallel;
    //                                         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    //                                         simpleDependencyResponse.debugContext!.whenDescription =
    //                                             simpleDependency.whenDescription;
    //                                     }
    //                                     return of(simpleDependencyResponse);
    //                                 }),
    //                                 catchError((err) => {
    //                                     simpleDependencyResponse.error = err;
    //                                     simpleDependencyResponse.hasError = true;
    //                                     simpleDependencyResponse.isSuccessful = false;
    //                                     simpleDependencyResponse.completedTime = moment.utc().toDate();
    //                                     return of(simpleDependencyResponse);
    //                                 })
    //                             );

    //                             accumulator[`${simpleDependency.name}-${index}`] = task;
    //                         });
    //                     }),
    //                     catchError((err) => {
    //                         const errReponse: SimpleDependencyExecutionResponse = {
    //                             name: `${simpleDependency.name}`,
    //                             isSkipped: false,
    //                             rule: simpleDependency.rule,
    //                             debugContext: undefined,
    //                             error: err,
    //                             hasError: true,
    //                             isSuccessful: false,
    //                             result: null,
    //                         };
    //                         accumulator[`${simpleDependency.name}`] = of(errReponse);

    //                         return of([]);
    //                     })
    //                 );
    //             }),
    //             tap(() => {
    //                 if (simpleDependency.afterDependency) {
    //                     accumulator[`${simpleDependency.name}-afterDependency`] = simpleDependency.afterDependency(
    //                         context
    //                     );
    //                 }
    //             })
    //         )
    //         .subscribe();

    //     registerMatchesHandler.unsubscribe();
    // }

    /**
     *
     * @param accumulator a dictionary of tasks
     * @param simpleDependency the simple dependency object
     * @param context the current execution context
     */
    // private extractSimpleDependencyTasks(
    //     accumulator: Record<
    //         string,
    //         Observable<SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse>
    //     >,
    //     simpleDependency: SimpleDependency,
    //     context: ExecutionContext
    // ) {
    //     // process when clause
    //     const whenSubscription = defer(() => {
    //         return simpleDependency.when
    //             ? this.processExpression(simpleDependency.when, context).pipe(
    //                   switchMap((r) => {
    //                       return of(_.get(r, '[0]', false));
    //                   })
    //               )
    //             : of(true);
    //     }).subscribe({
    //         next: (x: boolean) => {
    //             if (x) {
    //                 this.processSimpleDependency(accumulator, simpleDependency, context);
    //             } else {
    //                 const skipped: SimpleDependencyExecutionResponse = {
    //                     name: `${simpleDependency.name}`,
    //                     isSkipped: true,
    //                     rule: simpleDependency.rule,
    //                     hasError: false,
    //                     isSuccessful: true,
    //                     result: null,
    //                 };
    //                 /* istanbul ignore next */
    //                 if (this.options.debug) {
    //                     skipped.debugContext = {
    //                         root: context.root,
    //                         whenDescription: simpleDependency.whenDescription,
    //                     };
    //                 }
    //                 accumulator[`${simpleDependency.name}`] = of(skipped);
    //             }
    //         },
    //         error: (err) => {
    //             const errorResponse: SimpleDependencyExecutionResponse = {
    //                 name: `${simpleDependency.name}`,
    //                 isSkipped: true,
    //                 rule: simpleDependency.rule,
    //                 error: err,
    //                 debugContext: undefined,
    //                 hasError: true,
    //                 isSuccessful: false,
    //                 result: null,
    //             };
    //             accumulator[`${simpleDependency.name}`] = of(errorResponse);
    //         },
    //     });

    //     whenSubscription.unsubscribe();
    // }

    // private extractCompositeDependencyTasks(
    //     accumulator: Record<
    //         string,
    //         Observable<SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse>
    //     >,
    //     compositeDependency: CompositeDependency,
    //     context: ExecutionContext
    // ) {
    //     const compositeDependencyResponse: CompositeDependencyExecutionResponse = {
    //         name: compositeDependency.name,
    //         hasError: false,
    //         isSuccessful: false,
    //         isSkipped: false,
    //         rules: [],
    //     };

    //     const whenSubscription = defer(() => {
    //         return compositeDependency.when
    //             ? this.processExpression(compositeDependency.when, context).pipe(
    //                   switchMap((r) => {
    //                       return of(_.get(r, '[0]', false));
    //                   })
    //               )
    //             : of(true);
    //     }).subscribe({
    //         next: (when: boolean) => {
    //             if (when) {
    //                 accumulator[compositeDependency.name] = of(true).pipe(
    //                     switchMap(() => {
    //                         compositeDependencyResponse.startDateTime = moment.utc().toDate();
    //                         return this.processCompositeDependency(compositeDependency, context);
    //                     }),
    //                     switchMap((r: CompositeDependencyExecutionResponse) => {
    //                         compositeDependencyResponse.isSuccessful = r.isSuccessful;
    //                         compositeDependencyResponse.hasError = r.hasError;
    //                         compositeDependencyResponse.error = r.error;
    //                         compositeDependencyResponse.rules = r.rules;
    //                         compositeDependencyResponse.completedTime = r.completedTime;
    //                         /* istanbul ignore next */
    //                         if (this.options.debug) {
    //                             compositeDependencyResponse.debugContext = r.debugContext;
    //                         }

    //                         return of(compositeDependencyResponse);
    //                     })
    //                 );
    //             } else {
    //                 compositeDependencyResponse.isSkipped = true;
    //                 compositeDependencyResponse.isSuccessful = true;

    //                 /* istanbul ignore next */
    //                 if (this.options.debug) {
    //                     compositeDependencyResponse.debugContext = {
    //                         root: context.root,
    //                         whenDescription: compositeDependency.whenDescription,
    //                     };
    //                 }
    //                 accumulator[`${compositeDependency.name}`] = of(compositeDependencyResponse);
    //             }
    //         },
    //         error: (err) => {
    //             compositeDependencyResponse.hasError = true;
    //             compositeDependencyResponse.error = err;
    //             accumulator[`${compositeDependency.name}`] = of(compositeDependencyResponse);
    //         },
    //     });

    //     whenSubscription.unsubscribe();
    // }

    /**
     *
     * @param compositeDependency
     * @param context
     */
    // private collectDependencyTasks(
    //     compositeDependency: CompositeDependency,
    //     context: ExecutionContext
    // ): Record<string, Observable<SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse>> {
    //     const tasks: Record<
    //         string,
    //         Observable<SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse>
    //     > = _.reduce(
    //         compositeDependency.rules,
    //         (accumulator: Record<string, Observable<any>>, rule) => {
    //             if (isSimpleDependency(rule)) {
    //                 this.extractSimpleDependencyTasks(accumulator, rule as SimpleDependency, context);
    //             } else if (isCompositeDependency(rule)) {
    //             /* istanbul ignore else  */
    //                 this.extractCompositeDependencyTasks(accumulator, rule as CompositeDependency, context);
    //             }
    //             return accumulator;
    //         },
    //         {}
    //     );

    //     return tasks;
    // }

    // /**
    //  * Process a compound dependency
    //  * @param compositeDependency the compound dependency object
    //  * @param context the current execution context
    //  */
    // private processCompositeDependency(
    //     compositeDependency: CompositeDependency,
    //     context: ExecutionContext
    // ): Observable<CompositeDependencyExecutionResponse> {
    //     const operator = compositeDependency.operator || Operator.AND;
    //     const executionOrder = compositeDependency.executionOrder || ExecutionOrder.Parallel;

    //     const response: CompositeDependencyExecutionResponse = {
    //         name: compositeDependency.name,
    //         hasError: false,
    //         isSkipped: false,
    //         isSuccessful: false,
    //         rules: [],
    //         startTime: moment.utc().toDate(),
    //     };

    //     /* istanbul ignore next */
    //     if (this.options.debug) {
    //         response.debugContext = {
    //             root: context.root,
    //             executionOrder,
    //             operator,
    //         };
    //     }

    //     const tasks = this.collectDependencyTasks(compositeDependency, context);

    //     const values = _.values(tasks);
    //     // let counter = 0;

    //     const runTask: Observable<(SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse)[]> =
    //         executionOrder === ExecutionOrder.Parallel
    //             ? forkJoin(tasks).pipe(
    //                   map(
    //                       (
    //                           results: Record<
    //                               string,
    //                               SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse
    //                           >
    //                       ) => {
    //                           const entries = _.entries(results).map(([, result]) => result);
    //                           response.rules = _.map(
    //                               entries,
    //                               (result: SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse) =>
    //                                   result
    //                           );

    //                           return entries;
    //                       }
    //                   )
    //               )
    //             : concat(...values).pipe(
    //                   tap((result) => {
    //                       response.rules.push(result);
    //                       // counter ++;
    //                   }),
    //                   toArray()
    //               );

    //     return runTask.pipe(
    //         switchMap((results: (SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse)[]) => {
    //             response.completedTime = moment.utc().toDate();
    //             response.isSuccessful =
    //                 operator === Operator.AND
    //                     ? _.every(
    //                           results,
    //                           (result: SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse) =>
    //                               result.isSuccessful
    //                       )
    //                     : _.some(
    //                           results,
    //                           (result: SimpleDependencyExecutionResponse | CompositeDependencyExecutionResponse) =>
    //                               result.isSuccessful
    //                       );
    //             response.hasError = !response.isSuccessful;
    //             return of(response);
    //         })
    //     );
    // }

    /**
     * Process a compound dependency
     * @param compositeDependency 
     * @param context 
     * @returns
     */
    private processCompositeDependency2(
        compositeDependency: CompositeDependency,
        context: ExecutionContext
    ) : Observable<CompositeDependencyExecutionResponse> {
        const operator = compositeDependency.operator || Operator.AND;
        const executionOrder = compositeDependency.executionOrder || ExecutionOrder.Parallel;

        const dependencyResponse: CompositeDependencyExecutionResponse = {
            name: compositeDependency.name,
            hasError: false,
            isSkipped: false,
            isSuccessful: false,
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

                //return of(dependencyResponse);

                // before dependency
                return (
                    compositeDependency.beforeDependency
                    ? compositeDependency.beforeDependency(context)
                    : of(null)
                ).pipe(
                    // run dependency
                    switchMap((beforeDependencyResult) => {
                        const tasks = _.map(compositeDependency.rules, rule => {
                            if (isSimpleDependency(rule)) {
                                return this.processSimpleDependency2(
                                    rule,
                                    context,
                                );
                            }

                            return this.processCompositeDependency2(
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
                            switchMap((responses: (SimpleDependencyResponse | CompositeDependencyExecutionResponse)[]) => {
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
                    switchMap((afterDependencyResult) => {
                        dependencyResponse.isSuccessful =
                            operator === Operator.AND
                                ? _.every(
                                    dependencyResponse.rules,
                                    (result: SimpleDependencyResponse | CompositeDependencyExecutionResponse) =>
                                        result.isSuccessful
                                )
                                : _.some(
                                    dependencyResponse.rules,
                                    (result: SimpleDependencyResponse | CompositeDependencyExecutionResponse) =>
                                        result.isSuccessful
                                );
                        dependencyResponse.hasError = !dependencyResponse.isSuccessful;
                        return of(dependencyResponse);
                    }),
                    catchError(err => {
                        dependencyResponse.hasError = true;
                        dependencyResponse.errors?.push(err);
                        dependencyResponse.isSuccessful = false;

                        return compositeDependency.onDependencyError
                        ? compositeDependency.onDependencyError(err, dependencyResponse, context)
                        : of(dependencyResponse);
                    }),
                )
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
    private processSimpleDependency2(
        simpleDependency: SimpleDependency,
        context: ExecutionContext
    ): Observable<SimpleDependencyResponse> {
        const dependencyResponse: SimpleDependencyResponse = {
            name: `${simpleDependency.name}`,
            isSkipped: false,
            rule: simpleDependency.rule,
            hasError: false,
            isSuccessful: false,
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
                    switchMap((beforeDependencyResult: any) => {
                        return this.processExpression(simpleDependency.path, context).pipe(
                            switchMap((pathObjects: any[]) => {
                                const executeOrder = simpleDependency.executionOrder || ExecutionOrder.Parallel;

                                const tasks = _.map(pathObjects, (pathObject, index) => {
                                    const executionResponse: SimpleDependencyExecutionResponse = {
                                        name: `${simpleDependency.name}`,
                                        isSkipped: false,
                                        rule: simpleDependency.rule,
                                        hasError: false,
                                        isSuccessful: false,
                                        index,
                                    };

                                    const task = of(pathObject).pipe(
                                        // before each match
                                        switchMap((pathObject: any) => {
                                            executionResponse.startTime = moment.utc().toDate();
                                            return simpleDependency.beforeEachDependency ?
                                                simpleDependency.beforeEachDependency(pathObject, index, context) : 
                                                of(null);
                                        }),
                                        // execute
                                        switchMap((beforeEachResult: any) => {
                                            return this.execute({
                                                root: pathObject,
                                                ruleName: simpleDependency.rule,
                                                parentExecutionContext: context,
                                            });
                                        }),
                                        // after each match
                                        switchMap((r: ExecutionResponse) => {
                                            executionResponse.isSuccessful = r.isSuccessful;
                                            executionResponse.executionResponse = r;

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

                                            return simpleDependency.afterEachDependency ?
                                                simpleDependency.afterEachDependency(pathObject, index, context) :
                                                of(executionResponse);
                                        }),
                                        tap(() => {
                                            executionResponse.completeTime = moment.utc().toDate();
                                            executionResponse.isSuccessful = true;
                                        }),
                                        catchError((err) => {
                                            dependencyResponse.errors?.push(err);
                                            executionResponse.hasError = true;
                                            executionResponse.isSuccessful = false;
                                            executionResponse.completeTime = moment.utc().toDate();

                                            if (simpleDependency.onEachDependencyError) {
                                                return simpleDependency.onEachDependencyError(
                                                    err,
                                                    executionResponse,
                                                    context
                                                );
                                            }

                                            return of(executionResponse);
                                        }),
                                        tap(() => {
                                            dependencyResponse.matches.push(executionResponse);
                                        }),
                                    );
                                    return task;
                                });

                                // TODO: fail fast in AND scenario
                                return executeOrder == ExecutionOrder.Sequential
                                    ? concat(...tasks).pipe(
                                        toArray()
                                    )
                                    : from(tasks).pipe(
                                        mergeAll(simpleDependency.maxCurrency),
                                        toArray(),
                                    );
                            }),
                            switchMap((responses: SimpleDependencyExecutionResponse[]) => {
                                return (
                                    simpleDependency.afterDependency
                                    ? simpleDependency.afterDependency(context).pipe(switchMapTo(of(responses)))
                                    : of(responses)
                                ).pipe(
                                    tap((responses: SimpleDependencyExecutionResponse[]) => {
                                        const executionErrors = _.chain(responses)
                                        .filter(response => response.hasError)
                                        .map(response => response.errors)
                                        .flatten()
                                        .value();

                                        dependencyResponse.errors = _.concat(dependencyResponse.errors, executionErrors);
                                    }),
                                );
                            })
                        );
                    }),
                    switchMap(() => {
                        dependencyResponse.hasError = false;
                        dependencyResponse.isSuccessful = true;
                        dependencyResponse.completeTime = moment.utc().toDate();
                        return of(dependencyResponse);
                    }),
                    catchError((err) => {
                        dependencyResponse.errors?.push(err);
                        dependencyResponse.hasError = true;
                        dependencyResponse.isSuccessful = false;
                        dependencyResponse.completeTime = moment.utc().toDate();

                        return simpleDependency.onDependencyError
                            ? simpleDependency.onDependencyError(err, dependencyResponse, context)
                            : of(dependencyResponse);
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
        const objectHash = hash(params.root);
        const contextHash = ruleHash + objectHash;
        const contextId = `${contextHash}${this.options.suppressDuplicateTasks ? '' : _.uniqueId('-')}`;
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
            debugContext: this.options.debug
                ? {
                      contextId,
                      root: context.root,
                      ruleName: rule.name,
                  }
                : undefined,
        };

        context._process$ = of(true).pipe(
            // call beforeAction
            switchMap((x) => {
                response.startDateTime = moment.utc().toDate();
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
            catchError((err) => {
                response.isSuccessful = false;
                response.hasError = true;
                response.error = err;
                response.completedTime = moment.utc().toDate();
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

                return throwError(err);
            }),
            tap((result) => {
                context.complete = true;
                response.isSuccessful = true;
                response.result = result;
                response.completedTime = moment.utc().toDate();
            }),
            // call dependency rules
            switchMap(() => {
                return (
                    rule.dependencies 
                    ? this.processCompositeDependency2(rule.dependencies, context).pipe(
                        tap((dependencyResponse: CompositeDependencyExecutionResponse) => {
                            response.dependency = dependencyResponse;
                        }),
                        switchMapTo(of(response)),
                    )
                    : of(response)
                );
            }),
            // call afterAction
            switchMap((response) => {
                if (rule.afterAction) {
                    return rule.afterAction(response, context).pipe(
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
