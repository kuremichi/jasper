"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JasperEngine = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const jsonata_1 = __importDefault(require("jsonata"));
const object_hash_1 = __importDefault(require("object-hash"));
const lodash_1 = __importDefault(require("lodash"));
const engine_option_1 = require("./engine.option");
const simple_dependency_1 = require("./dependency/simple.dependency");
const enum_1 = require("./enum");
const rule_store_interfafce_1 = require("./store/rule.store.interfafce");
class JasperEngine {
    constructor(ruleStore, options = engine_option_1.DefaultEngineOptions, logger = console) {
        this.options = options;
        this.contextStore = {};
        this.ruleStore = ruleStore;
        this.logger = logger;
    }
    executeAction(params) {
        if (typeof params.action === 'string' || params.action instanceof String) {
            const expression = jsonata_1.default(params.action);
            const result = expression.evaluate(params.context.root);
            return rxjs_1.of(result);
        }
        if (params.action instanceof rxjs_1.Observable) {
            return rxjs_1.from(params.action);
        }
        if (params.action instanceof Function) {
            return params.action(params.context);
        }
        return rxjs_1.of(null);
    }
    processExpression(expression, context) {
        if (typeof expression === 'string') {
            const jsonataExpression = jsonata_1.default(expression);
            const expressionObject = jsonataExpression.evaluate(context.root);
            return rxjs_1.of(expressionObject).pipe(operators_1.toArray(), operators_1.map((arr) => {
                return lodash_1.default.chain(lodash_1.default.flatten(arr))
                    .filter((expressionObject) => expressionObject)
                    .value();
            }));
        }
        if (expression instanceof Function) {
            return expression(context).pipe(operators_1.toArray(), operators_1.map((arr) => {
                return lodash_1.default.chain(lodash_1.default.flatten(arr))
                    .filter((expressionObject) => expressionObject)
                    .value();
            }));
        }
        return rxjs_1.of([]);
    }
    processCompositeDependency(compositeDependency, context) {
        const operator = compositeDependency.operator || enum_1.Operator.AND;
        const executionOrder = compositeDependency.executionOrder || enum_1.ExecutionOrder.Parallel;
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
            ? this.processExpression(compositeDependency.when, context).pipe(operators_1.switchMap((whenResult) => {
                const w = lodash_1.default.get(whenResult, '[0]', false);
                return rxjs_1.of(w);
            }))
            : rxjs_1.of(true)).pipe(operators_1.switchMap((run) => {
            dependencyResponse.isSkipped = !run;
            if (dependencyResponse.isSkipped) {
                if (this.options.debug) {
                    dependencyResponse.debugContext = {
                        root: context.root,
                        whenDescription: compositeDependency.whenDescription,
                    };
                }
                return rxjs_1.of(dependencyResponse);
            }
            return (compositeDependency.beforeDependency
                ? compositeDependency.beforeDependency(context)
                : rxjs_1.of(null)).pipe(operators_1.switchMap((beforeDependencyResult) => {
                const tasks = lodash_1.default.map(compositeDependency.rules, (rule) => {
                    if (simple_dependency_1.isSimpleDependency(rule)) {
                        return this.processSimpleDependency(rule, context);
                    }
                    return this.processCompositeDependency(rule, context);
                });
                return (executionOrder == enum_1.ExecutionOrder.Sequential
                    ? rxjs_1.concat(...tasks).pipe(operators_1.toArray())
                    : rxjs_1.from(tasks).pipe(operators_1.mergeAll(compositeDependency.maxCurrency), operators_1.toArray())).pipe(operators_1.switchMap((responses) => {
                    dependencyResponse.rules = responses;
                    return rxjs_1.of(dependencyResponse);
                }));
            }), operators_1.switchMap(() => {
                return compositeDependency.afterDependency
                    ? compositeDependency.afterDependency(context)
                    : rxjs_1.of(null);
            }), operators_1.switchMap((afterDependencyResult) => {
                dependencyResponse.isSuccessful =
                    operator === enum_1.Operator.AND
                        ? lodash_1.default.every(dependencyResponse.rules, (result) => result.isSuccessful)
                        : lodash_1.default.some(dependencyResponse.rules, (result) => result.isSuccessful);
                dependencyResponse.hasError = !dependencyResponse.isSuccessful;
                return rxjs_1.of(dependencyResponse);
            }));
        }), operators_1.catchError((err) => {
            dependencyResponse.hasError = true;
            dependencyResponse.errors.push(err);
            dependencyResponse.isSuccessful = false;
            return compositeDependency.onDependencyError
                ? compositeDependency.onDependencyError(err, dependencyResponse, context)
                : rxjs_1.of(dependencyResponse);
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
            ? this.processExpression(simpleDependency.when, context).pipe(operators_1.switchMap((whenResult) => {
                const w = lodash_1.default.get(whenResult, '[0]', false);
                return rxjs_1.of(w);
            }))
            : rxjs_1.of(true)).pipe(operators_1.switchMap((run) => {
            dependencyResponse.isSkipped = !run;
            if (dependencyResponse.isSkipped) {
                if (this.options.debug) {
                    dependencyResponse.debugContext = {
                        root: context.root,
                        whenDescription: simpleDependency.whenDescription,
                    };
                }
                return rxjs_1.of(dependencyResponse);
            }
            return (simpleDependency.beforeDependency ? simpleDependency.beforeDependency(context) : rxjs_1.of(null)).pipe(operators_1.switchMap((beforeDependencyResult) => {
                return this.processExpression(simpleDependency.path, context).pipe(operators_1.switchMap((pathObjects) => {
                    const executeOrder = simpleDependency.executionOrder || enum_1.ExecutionOrder.Parallel;
                    const tasks = lodash_1.default.map(pathObjects, (pathObject, index) => {
                        const executionResponse = {
                            name: `${simpleDependency.name}`,
                            rule: simpleDependency.rule,
                            hasError: false,
                            isSuccessful: true,
                            index,
                            result: undefined,
                        };
                        const task = rxjs_1.of(pathObject).pipe(operators_1.switchMap((pathObject) => {
                            executionResponse.startTime = new Date();
                            return simpleDependency.beforeEach
                                ? simpleDependency.beforeEach(pathObject, index, context)
                                : rxjs_1.of(null);
                        }), operators_1.switchMap((beforeEachResult) => {
                            return this.execute({
                                root: pathObject,
                                ruleName: simpleDependency.rule,
                                parentExecutionContext: context,
                            });
                        }), operators_1.tap((r) => {
                            lodash_1.default.merge(executionResponse, r);
                            if (this.options.debug) {
                                executionResponse.debugContext = r.debugContext;
                                executionResponse.debugContext.executionOrder =
                                    simpleDependency.executionOrder || enum_1.ExecutionOrder.Parallel;
                                executionResponse.debugContext.whenDescription =
                                    simpleDependency.whenDescription;
                            }
                        }), operators_1.switchMap((response) => {
                            if (executionResponse.hasError &&
                                executionResponse.error &&
                                simpleDependency.onEachError) {
                                return simpleDependency.onEachError(response.error, executionResponse, context);
                            }
                            return rxjs_1.of(dependencyResponse);
                        }), operators_1.switchMap(() => {
                            return simpleDependency.afterEach
                                ? simpleDependency
                                    .afterEach(pathObject, index, context)
                                    .pipe(operators_1.switchMapTo(rxjs_1.of(executionResponse)))
                                : rxjs_1.of(executionResponse);
                        }), operators_1.tap(() => {
                            executionResponse.completeTime = new Date();
                            dependencyResponse.matches.push(executionResponse);
                        }), operators_1.catchError((err) => {
                            executionResponse.hasError = true;
                            executionResponse.error = err;
                            executionResponse.isSuccessful = false;
                            executionResponse.completeTime = new Date();
                            return rxjs_1.of(executionResponse);
                        }));
                        return task;
                    });
                    return executeOrder == enum_1.ExecutionOrder.Sequential
                        ? rxjs_1.concat(...tasks).pipe(operators_1.toArray())
                        : rxjs_1.from(tasks).pipe(operators_1.mergeAll(simpleDependency.maxCurrency), operators_1.toArray());
                }), operators_1.switchMap((responses) => {
                    return (simpleDependency.afterDependency
                        ? simpleDependency.afterDependency(context).pipe(operators_1.switchMap((afterDependencyResult) => {
                            return rxjs_1.of(responses);
                        }))
                        : rxjs_1.of(responses)).pipe(operators_1.switchMap((responses) => {
                        dependencyResponse.completeTime = new Date();
                        const executionErrors = lodash_1.default.chain(responses)
                            .filter((response) => response.hasError && response.error)
                            .map((response) => response.error)
                            .value();
                        dependencyResponse.errors = lodash_1.default.concat(dependencyResponse.errors, executionErrors);
                        dependencyResponse.hasError = dependencyResponse.errors.length > 0;
                        dependencyResponse.isSuccessful = lodash_1.default.every(responses, (response) => response.isSuccessful);
                        dependencyResponse.matches = lodash_1.default.orderBy(dependencyResponse.matches, ['index'], ['asc']);
                        return rxjs_1.of(dependencyResponse);
                    }));
                }));
            }));
        }), operators_1.catchError((err) => {
            dependencyResponse.hasError = true;
            dependencyResponse.isSuccessful = false;
            dependencyResponse.completeTime = new Date();
            return simpleDependency.onDependencyError
                ? simpleDependency.onDependencyError(err, dependencyResponse, context)
                : rxjs_1.of(dependencyResponse).pipe(operators_1.tap((dependencyResponse) => {
                    dependencyResponse.errors.push(err);
                }));
        }));
    }
    execute(params) {
        const debugContext = this.options.debug
            ? {
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
        return this.ruleStore.get(params.ruleName).pipe(operators_1.catchError(err => {
            response.error = err;
            return rxjs_1.of(undefined);
        }), operators_1.switchMap((rule) => {
            if (!rule) {
                response.error = response.error || new rule_store_interfafce_1.RuleNotFoundException(params.ruleName);
                response.hasError = true;
                response.isSuccessful = false;
                return rxjs_1.of(response);
            }
            return rxjs_1.of(rule).pipe(operators_1.switchMap((rule) => {
                const ruleHash = object_hash_1.default(params.ruleName);
                const objectHash = object_hash_1.default(rule.uniqueBy ? rule.uniqueBy(params.root) : params.root);
                const contextHash = ruleHash + objectHash;
                const dedupId = this.options.suppressDuplicateTasks ? '' : `-${lodash_1.default.random(0, 10000)}`;
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
                        _process$: rxjs_1.of(null),
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
                        (params.parentExecutionContext.childrenContexts = params.parentExecutionContext.childrenContexts || {})[context.contextId] = context;
                    }
                    context._process$ = rxjs_1.of(true).pipe(operators_1.switchMap(() => {
                        context.response.startTime = new Date();
                        if (rule.beforeAction) {
                            return rule.beforeAction(context).pipe(operators_1.tap(() => {
                                if (this.options.debug) {
                                    this.logger.debug(`before action executed for rule ${rule.name} - context ${context.contextId}`);
                                }
                            }));
                        }
                        return rxjs_1.of(null);
                    }), operators_1.switchMap(() => {
                        if (rule.action) {
                            return this.executeAction({
                                action: rule.action,
                                context,
                            });
                        }
                        return this.options.recipe === enum_1.EngineRecipe.BusinessProcessEngine
                            ? rxjs_1.of(null)
                            : rxjs_1.of(true);
                    }), operators_1.tap((result) => {
                        context.complete = true;
                        context.response.isSuccessful = true;
                        context.response.result = result;
                        context.response.completeTime = new Date();
                    }), operators_1.switchMap(() => {
                        return rule.dependencies
                            ? this.processCompositeDependency(rule.dependencies, context).pipe(operators_1.tap((dependencyResponse) => {
                                context.response.dependency = dependencyResponse;
                                context.response.isSuccessful = context.response.isSuccessful && dependencyResponse.isSuccessful;
                            }), operators_1.switchMapTo(rxjs_1.of(context.response)))
                            : rxjs_1.of(context.response);
                    }), operators_1.switchMap((response) => {
                        if (this.options.recipe === enum_1.EngineRecipe.ValidationRuleEngine) {
                            response.isSuccessful = response.isSuccessful && response.result === true;
                        }
                        if (rule.afterAction) {
                            return rule.afterAction(context).pipe(operators_1.tap(() => {
                                if (this.options.debug) {
                                    this.logger.debug(`after action executed for rule ${rule.name} - context ${context.contextId}`);
                                }
                            }));
                        }
                        return rxjs_1.of(response);
                    }), operators_1.catchError((err) => {
                        context.response.isSuccessful = false;
                        context.response.hasError = true;
                        context.response.error = err;
                        context.response.completeTime = new Date();
                        if (rule.onError) {
                            return rule.onError(err, context).pipe(operators_1.tap(() => {
                                if (this.options.debug) {
                                    this.logger.debug(`onError executed for rule ${rule.name} - context ${context.contextId}`);
                                }
                            }));
                        }
                        return rxjs_1.of(context.response);
                    }));
                    if (this.options.suppressDuplicateTasks) {
                        context._process$ = context._process$.pipe(operators_1.shareReplay(1));
                    }
                    else {
                        context._process$ = context._process$.pipe(operators_1.share());
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
exports.JasperEngine = JasperEngine;
//# sourceMappingURL=engine.js.map