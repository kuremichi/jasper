import { of, from, concat } from 'rxjs';
import { switchMap, tap, toArray, share, catchError, shareReplay, map, switchMapTo, mergeAll } from 'rxjs/operators';
import jsonata from 'jsonata';
import hash from 'object-hash';
import _ from 'lodash';
import { DefaultEngineOptions } from './engine.option';
import { isSimpleDependency } from './dependency/simple.dependency';
import { ExecutionOrder, EngineRecipe, Operator } from './enum';
import { RuleNotFoundException } from './store/rule.store.interfafce';
import { DummyLogger } from './ILogger';
export class JasperEngine {
    constructor({ ruleStore, options, logger }) {
        this.options = options || DefaultEngineOptions;
        this.contextStore = {};
        this.ruleStore = ruleStore;
        this.logger = logger || DummyLogger;
    }
    executeAction(params) {
        if (typeof params.action === 'string' || params.action instanceof String) {
            const expression = jsonata(params.action);
            const result = expression.evaluate(params.context.root);
            return of(result);
        }
        if (params.action instanceof Function) {
            return params.action(params.context);
        }
        return of(null);
    }
    processExpression(expression, context) {
        if (typeof expression === 'string') {
            const jsonataExpression = jsonata(expression);
            const expressionObject = jsonataExpression.evaluate(context.root);
            return of(expressionObject).pipe(toArray(), map((arr) => {
                return _.chain(_.flatten(arr))
                    .filter((expressionObject) => expressionObject)
                    .value();
            }));
        }
        if (expression instanceof Function) {
            return expression(context).pipe(toArray(), map((arr) => {
                return _.chain(_.flatten(arr))
                    .filter((expressionObject) => expressionObject)
                    .value();
            }));
        }
        return of([]);
    }
    processCompositeDependency(compositeDependency, context) {
        const operator = compositeDependency.operator || Operator.AND;
        const executionOrder = compositeDependency.executionOrder || ExecutionOrder.Parallel;
        const dependencyResponse = {
            name: compositeDependency.name,
            hasError: false,
            errors: [],
            isSkipped: false,
            isSuccessful: true,
            rules: [],
            startTime: new Date(),
        };
        if (this.options.debug) {
            dependencyResponse.debugContext = {
                root: context.root,
                executionOrder,
                operator,
            };
        }
        return (compositeDependency.when
            ? this.processExpression(compositeDependency.when, context).pipe(switchMap((whenResult) => {
                const w = _.get(whenResult, '[0]', false);
                return of(w);
            }))
            : of(true)).pipe(switchMap((run) => {
            dependencyResponse.isSkipped = !run;
            if (dependencyResponse.isSkipped) {
                if (this.options.debug) {
                    dependencyResponse.debugContext = {
                        root: context.root,
                        whenDescription: compositeDependency.whenDescription,
                    };
                }
                return of(dependencyResponse);
            }
            return (compositeDependency.beforeDependency
                ? compositeDependency.beforeDependency(context)
                : of(null)).pipe(switchMap((beforeDependencyResult) => {
                const tasks = _.map(compositeDependency.rules, (rule) => {
                    if (isSimpleDependency(rule)) {
                        return this.processSimpleDependency(rule, context);
                    }
                    return this.processCompositeDependency(rule, context);
                });
                return (executionOrder == ExecutionOrder.Sequential
                    ? concat(...tasks).pipe(toArray())
                    : from(tasks).pipe(mergeAll(compositeDependency.maxCurrency), toArray())).pipe(switchMap((responses) => {
                    dependencyResponse.rules = responses;
                    return of(dependencyResponse);
                }));
            }), switchMap(() => {
                return compositeDependency.afterDependency
                    ? compositeDependency.afterDependency(context)
                    : of(null);
            }), switchMap((afterDependencyResult) => {
                dependencyResponse.isSuccessful =
                    operator === Operator.AND
                        ? _.every(dependencyResponse.rules, (result) => result.isSuccessful)
                        : _.some(dependencyResponse.rules, (result) => result.isSuccessful);
                dependencyResponse.hasError = !dependencyResponse.isSuccessful;
                return of(dependencyResponse);
            }));
        }), catchError((err) => {
            dependencyResponse.hasError = true;
            dependencyResponse.errors.push(err);
            dependencyResponse.isSuccessful = false;
            return compositeDependency.onDependencyError
                ? compositeDependency.onDependencyError(err, dependencyResponse, context)
                : of(dependencyResponse);
        }));
    }
    processSimpleDependency(simpleDependency, context) {
        const dependencyResponse = {
            name: `${simpleDependency.name}`,
            isSkipped: false,
            rule: simpleDependency.rule,
            hasError: false,
            isSuccessful: true,
            errors: [],
            matches: [],
        };
        return (simpleDependency.when
            ? this.processExpression(simpleDependency.when, context).pipe(switchMap((whenResult) => {
                const w = _.get(whenResult, '[0]', false);
                return of(w);
            }))
            : of(true)).pipe(switchMap((run) => {
            dependencyResponse.isSkipped = !run;
            if (dependencyResponse.isSkipped) {
                if (this.options.debug) {
                    dependencyResponse.debugContext = {
                        root: context.root,
                        whenDescription: simpleDependency.whenDescription,
                    };
                }
                return of(dependencyResponse);
            }
            return (simpleDependency.beforeDependency ? simpleDependency.beforeDependency(context) : of(null)).pipe(switchMap((beforeDependencyResult) => {
                return this.processExpression(simpleDependency.path, context).pipe(switchMap((pathObjects) => {
                    const executeOrder = simpleDependency.executionOrder || ExecutionOrder.Parallel;
                    const tasks = _.map(pathObjects, (pathObject, index) => {
                        const executionResponse = {
                            name: `${simpleDependency.name}`,
                            rule: simpleDependency.rule,
                            hasError: false,
                            isSuccessful: true,
                            index,
                            result: undefined,
                        };
                        const task = of(pathObject).pipe(switchMap((pathObject) => {
                            executionResponse.startTime = new Date();
                            return simpleDependency.beforeEach
                                ? simpleDependency.beforeEach(pathObject, index, context)
                                : of(null);
                        }), switchMap((beforeEachResult) => {
                            return this.execute({
                                root: pathObject,
                                ruleName: simpleDependency.rule,
                                parentExecutionContext: context,
                            });
                        }), tap((r) => {
                            _.merge(executionResponse, r);
                            if (this.options.debug) {
                                executionResponse.debugContext = r.debugContext;
                                executionResponse.debugContext.executionOrder =
                                    simpleDependency.executionOrder || ExecutionOrder.Parallel;
                                executionResponse.debugContext.whenDescription =
                                    simpleDependency.whenDescription;
                            }
                        }), switchMap((response) => {
                            if (executionResponse.hasError &&
                                executionResponse.error &&
                                simpleDependency.onEachError) {
                                return simpleDependency.onEachError(response.error, executionResponse, context);
                            }
                            return of(dependencyResponse);
                        }), switchMap(() => {
                            return simpleDependency.afterEach
                                ? simpleDependency
                                    .afterEach(pathObject, index, context)
                                    .pipe(switchMapTo(of(executionResponse)))
                                : of(executionResponse);
                        }), tap(() => {
                            executionResponse.completeTime = new Date();
                            dependencyResponse.matches.push(executionResponse);
                        }), catchError((err) => {
                            executionResponse.hasError = true;
                            executionResponse.error = err;
                            executionResponse.isSuccessful = false;
                            executionResponse.completeTime = new Date();
                            return of(executionResponse);
                        }));
                        return task;
                    });
                    return executeOrder == ExecutionOrder.Sequential
                        ? concat(...tasks).pipe(toArray())
                        : from(tasks).pipe(mergeAll(simpleDependency.maxCurrency), toArray());
                }), switchMap((responses) => {
                    return (simpleDependency.afterDependency
                        ? simpleDependency.afterDependency(context).pipe(switchMap((afterDependencyResult) => {
                            return of(responses);
                        }))
                        : of(responses)).pipe(switchMap((responses) => {
                        dependencyResponse.completeTime = new Date();
                        const executionErrors = _.chain(responses)
                            .filter((response) => response.hasError && response.error)
                            .map((response) => response.error)
                            .value();
                        dependencyResponse.errors = _.concat(dependencyResponse.errors, executionErrors);
                        dependencyResponse.hasError = dependencyResponse.errors.length > 0;
                        dependencyResponse.isSuccessful = _.every(responses, (response) => response.isSuccessful);
                        dependencyResponse.matches = _.orderBy(dependencyResponse.matches, ['index'], ['asc']);
                        return of(dependencyResponse);
                    }));
                }));
            }));
        }), catchError((err) => {
            dependencyResponse.hasError = true;
            dependencyResponse.isSuccessful = false;
            dependencyResponse.completeTime = new Date();
            return simpleDependency.onDependencyError
                ? simpleDependency.onDependencyError(err, dependencyResponse, context)
                : of(dependencyResponse).pipe(tap((dependencyResponse) => {
                    dependencyResponse.errors.push(err);
                }));
        }));
    }
    execute(params) {
        const debugContext = this.options.debug
            ?
                {
                    contextId: '',
                    root: params.root,
                    ruleName: params.ruleName,
                }
            : undefined;
        const response = {
            rule: params.ruleName,
            hasError: false,
            isSuccessful: true,
            result: undefined,
            debugContext,
        };
        return this.ruleStore.get(params.ruleName).pipe(catchError((err) => {
            response.error = err;
            return of(undefined);
        }), switchMap((rule) => {
            if (!rule) {
                response.error = response.error || new RuleNotFoundException(params.ruleName);
                response.hasError = true;
                response.isSuccessful = false;
                return of(response);
            }
            return of(rule).pipe(switchMap((rule) => {
                const ruleHash = hash(params.ruleName);
                const objectHash = hash(rule.uniqueBy ? rule.uniqueBy(params.root) : params.root);
                const contextHash = ruleHash + objectHash;
                const dedupId = this.options.suppressDuplicateTasks ? '' : `-${_.random(0, 10000)}`;
                const contextId = `${contextHash}${dedupId}`;
                let context = this.contextStore[contextId];
                if (!context || this.options.suppressDuplicateTasks !== true) {
                    response.metadata = rule.metadata;
                    if (debugContext) {
                        debugContext.contextId = contextId;
                    }
                    context = {
                        contextId,
                        rule,
                        root: params.root,
                        _process$: of(null),
                        complete: false,
                        contextData: {},
                        response,
                    };
                    if (this.options.debug) {
                        context.contextData.objectHash = objectHash;
                    }
                    this.contextStore[contextId] = context;
                    if (params.parentExecutionContext) {
                        context.parentContext = params.parentExecutionContext;
                        (params.parentExecutionContext.childrenContexts =
                            params.parentExecutionContext.childrenContexts || {})[context.contextId] = context;
                    }
                    context._process$ = of(true).pipe(switchMap(() => {
                        context.response.startTime = new Date();
                        if (rule.beforeAction) {
                            return rule.beforeAction(context).pipe(tap(() => {
                                if (this.options.debug) {
                                    this.logger.debug(`before action executed for rule ${rule.name} - context ${context.contextId}`);
                                }
                            }));
                        }
                        return of(null);
                    }), switchMap(() => {
                        if (rule.action) {
                            return this.executeAction({
                                action: rule.action,
                                context,
                            });
                        }
                        return this.options.recipe === EngineRecipe.BusinessProcessEngine
                            ? of(null)
                            : of(true);
                    }), tap((result) => {
                        context.complete = true;
                        context.response.isSuccessful = true;
                        context.response.result = result;
                        context.response.completeTime = new Date();
                    }), switchMap(() => {
                        return rule.dependencies
                            ? this.processCompositeDependency(rule.dependencies, context).pipe(tap((dependencyResponse) => {
                                context.response.dependency = dependencyResponse;
                                context.response.isSuccessful =
                                    context.response.isSuccessful && dependencyResponse.isSuccessful;
                            }), switchMapTo(of(context.response)))
                            : of(context.response);
                    }), switchMap((response) => {
                        if (this.options.recipe === EngineRecipe.ValidationRuleEngine) {
                            response.isSuccessful = response.isSuccessful && response.result === true;
                        }
                        if (rule.afterAction) {
                            return rule.afterAction(context).pipe(tap(() => {
                                if (this.options.debug) {
                                    this.logger.debug(`after action executed for rule ${rule.name} - context ${context.contextId}`);
                                }
                            }));
                        }
                        return of(response);
                    }), catchError((err) => {
                        context.response.isSuccessful = false;
                        context.response.hasError = true;
                        context.response.error = err;
                        context.response.completeTime = new Date();
                        if (rule.onError) {
                            if (typeof rule.onError === 'string') {
                                this.logger.error(err);
                                try {
                                    const errExpression = jsonata(rule.onError);
                                    const result = errExpression.evaluate(context.root);
                                    context.response.error = result;
                                }
                                catch (error) {
                                    context.response.error = error;
                                }
                                return of(context.response);
                            }
                            return rule.onError(err, context).pipe(tap(() => {
                                if (this.options.debug) {
                                    this.logger.debug(`onError executed for rule ${rule.name} - context ${context.contextId}`);
                                }
                            }));
                        }
                        return of(context.response);
                    }));
                    if (this.options.suppressDuplicateTasks) {
                        context._process$ = context._process$.pipe(shareReplay(1));
                    }
                    else {
                        context._process$ = context._process$.pipe(share());
                    }
                    return context._process$;
                }
                return context._process$;
            }));
        }));
    }
    run(params) {
        return this.execute({ root: params.root, ruleName: params.ruleName });
    }
}
//# sourceMappingURL=engine.js.map