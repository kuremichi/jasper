"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JasperEngine = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const rule_config_1 = require("./rule.config");
const jsonata_1 = __importDefault(require("jsonata"));
const object_hash_1 = __importDefault(require("object-hash"));
const lodash_1 = __importDefault(require("lodash"));
const moment_1 = __importDefault(require("moment"));
/* istanbul ignore next */
// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = (async () => { }).constructor;
/* istanbul ignore next */
// eslint-disable-next-line require-yield
const GeneratorFunction = function* () {
    return {};
}.constructor;
class JasperEngine {
    /**
     *
     * @param ruleStore a dictionary of all rules
     * @param options options
     * @param logger logger
     */
    constructor(ruleStore, options = rule_config_1.DefaultEngineOptions, logger = console) {
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
    executeAction(params) {
        if (typeof params.action === 'string' || params.action instanceof String) {
            const expression = jsonata_1.default(params.action);
            return rxjs_1.of(expression.evaluate(params.context.root));
        }
        if (params.action instanceof rxjs_1.Observable) {
            return rxjs_1.from(params.action);
        }
        if (params.action instanceof Function) {
            return params.action(params.context);
        }
        return rxjs_1.of(null);
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
        if (expression instanceof rxjs_1.Observable) {
            return expression.pipe(operators_1.toArray(), operators_1.map((arr) => {
                return lodash_1.default.chain(lodash_1.default.flatten(arr))
                    .filter((expressionObject) => expressionObject)
                    .value();
            }));
        }
        if (expression instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) {
            // TODO: fix the bug where exception thrown by async function will stop the while stream
            return rxjs_1.from(expression(context)).pipe(operators_1.toArray(), operators_1.map((arr) => {
                return lodash_1.default.chain(lodash_1.default.flatten(arr))
                    .filter((expressionObject) => expressionObject)
                    .value();
            }));
        }
        if (expression instanceof Function) {
            return rxjs_1.of(1).pipe(operators_1.switchMap(() => {
                try {
                    return rxjs_1.of(expression(context));
                }
                catch (error) {
                    return rxjs_1.throwError(error);
                }
            }), operators_1.toArray(), operators_1.map((arr) => {
                return lodash_1.default.chain(lodash_1.default.flatten(arr))
                    .filter((expressionObject) => expressionObject)
                    .value();
            }));
        }
        return rxjs_1.of([]);
    }
    /**
     * Process a simple dependency
     * it will execute the path expression and for each match schedule an observables and add to the accumulator
     * @param accumulator a dictionary of tasks
     * @param compoundDependency the compound dependency object
     * @param context the current execution context
     */
    processSimpleDependency(accumulator, simpleDependency, context) {
        const registerMatchesHandler = this.processExpression(simpleDependency.path, context).subscribe((pathObjects) => {
            lodash_1.default.each(pathObjects, (pathObject, index) => {
                const simpleDependencyResponse = {
                    name: `${simpleDependency.name}`,
                    isSkipped: false,
                    rule: simpleDependency.rule,
                    hasError: false,
                    isSuccessful: false,
                    result: null,
                    index,
                };
                const task = rxjs_1.of(pathObject).pipe(operators_1.switchMap((pathObject) => {
                    simpleDependencyResponse.startDateTime = moment_1.default.utc().toDate();
                    return this.execute({
                        root: pathObject,
                        ruleName: simpleDependency.rule,
                        parentExecutionContext: context,
                    });
                }), operators_1.switchMap((r) => {
                    simpleDependencyResponse.result = r.result;
                    simpleDependencyResponse.isSuccessful = r.isSuccessful;
                    simpleDependencyResponse.dependency = r.dependency;
                    simpleDependencyResponse.startDateTime = r.startDateTime;
                    simpleDependencyResponse.completedTime = r.completedTime;
                    if (this.options.debug) {
                        simpleDependencyResponse.debugContext = r.debugContext;
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        simpleDependencyResponse.debugContext.executionOrder = simpleDependency.executionOrder || rule_config_1.ExecutionOrder.Parallel;
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        simpleDependencyResponse.debugContext.whenDescription = simpleDependency.whenDescription;
                    }
                    return rxjs_1.of(simpleDependencyResponse);
                }), operators_1.catchError((err) => {
                    simpleDependencyResponse.error = err;
                    simpleDependencyResponse.hasError = true;
                    simpleDependencyResponse.isSuccessful = false;
                    simpleDependencyResponse.completedTime = moment_1.default.utc().toDate();
                    return rxjs_1.of(simpleDependencyResponse);
                }));
                accumulator[`${simpleDependency.name}-${index}`] = task;
            });
        }, (err) => {
            const errReponse = {
                name: `${simpleDependency.name}`,
                isSkipped: false,
                rule: simpleDependency.rule,
                debugContext: undefined,
                error: err,
                hasError: true,
                isSuccessful: false,
                result: null,
            };
            accumulator[`${simpleDependency.name}`] = rxjs_1.of(errReponse);
        });
        registerMatchesHandler.unsubscribe();
    }
    /**
     *
     * @param accumulator a dictionary of tasks
     * @param simpleDependency the simple dependency object
     * @param context the current execution context
     */
    extractSimpleDependencyTasks(accumulator, simpleDependency, context) {
        // process when clause
        const whenSubscription = rxjs_1.defer(() => {
            return simpleDependency.when ? this.processExpression(simpleDependency.when, context).pipe(operators_1.switchMap(r => {
                return rxjs_1.of(lodash_1.default.get(r, '[0]', false));
            })) : rxjs_1.of(true);
        }).subscribe({
            next: (x) => {
                if (x) {
                    this.processSimpleDependency(accumulator, simpleDependency, context);
                }
                else {
                    const skipped = {
                        name: `${simpleDependency.name}`,
                        isSkipped: true,
                        rule: simpleDependency.rule,
                        hasError: false,
                        isSuccessful: true,
                        result: null,
                    };
                    if (this.options.debug) {
                        skipped.debugContext = {
                            root: context.root,
                            whenDescription: simpleDependency.whenDescription,
                        };
                    }
                    accumulator[`${simpleDependency.name}`] = rxjs_1.of(skipped);
                }
            },
            error: (err) => {
                const errorResponse = {
                    name: `${simpleDependency.name}`,
                    isSkipped: true,
                    rule: simpleDependency.rule,
                    error: err,
                    debugContext: undefined,
                    hasError: true,
                    isSuccessful: false,
                    result: null,
                };
                accumulator[`${simpleDependency.name}`] = rxjs_1.of(errorResponse);
            }
        });
        whenSubscription.unsubscribe();
    }
    extractCompoundDependencyTasks(accumulator, compoundDependency, context) {
        const compoundDependencyResponse = {
            name: compoundDependency.name,
            hasError: false,
            isSuccessful: false,
            isSkipped: false,
            rules: [],
        };
        const whenSubscription = rxjs_1.defer(() => {
            return compoundDependency.when ? this.processExpression(compoundDependency.when, context).pipe(operators_1.switchMap(r => {
                return rxjs_1.of(lodash_1.default.get(r, '[0]', false));
            })) : rxjs_1.of(true);
        }).subscribe({
            next: (when) => {
                if (when) {
                    accumulator[compoundDependency.name] = rxjs_1.of(true).pipe(operators_1.switchMap(() => {
                        compoundDependencyResponse.startDateTime = moment_1.default.utc().toDate();
                        return this.processCompoundDependency(compoundDependency, context);
                    }), operators_1.switchMap((r) => {
                        compoundDependencyResponse.isSuccessful = r.isSuccessful;
                        compoundDependencyResponse.hasError = r.hasError;
                        compoundDependencyResponse.error = r.error;
                        compoundDependencyResponse.rules = r.rules;
                        compoundDependencyResponse.completedTime = r.completedTime;
                        /* istanbul ignore next */
                        if (this.options.debug) {
                            compoundDependencyResponse.debugContext = r.debugContext;
                        }
                        return rxjs_1.of(compoundDependencyResponse);
                    }));
                }
                else {
                    compoundDependencyResponse.isSkipped = true;
                    compoundDependencyResponse.isSuccessful = true;
                    /* istanbul ignore next */
                    if (this.options.debug) {
                        compoundDependencyResponse.debugContext = {
                            root: context.root,
                            whenDescription: compoundDependency.whenDescription,
                        };
                    }
                    accumulator[`${compoundDependency.name}`] = rxjs_1.of(compoundDependencyResponse);
                }
            },
            error: (err) => {
                compoundDependencyResponse.hasError = true;
                compoundDependencyResponse.error = err;
                accumulator[`${compoundDependency.name}`] = rxjs_1.of(compoundDependencyResponse);
            }
        });
        whenSubscription.unsubscribe();
    }
    /**
     *
     * @param compoundDependency
     * @param context
     */
    collectDependencyTasks(compoundDependency, context) {
        const tasks = lodash_1.default.reduce(compoundDependency.rules, (accumulator, rule) => {
            if (rule_config_1.isSimpleDependency(rule)) {
                this.extractSimpleDependencyTasks(accumulator, rule, context);
            }
            /* istanbul ignore else  */
            else if (rule_config_1.isCompoundDependency(rule)) {
                this.extractCompoundDependencyTasks(accumulator, rule, context);
            }
            return accumulator;
        }, {});
        return tasks;
    }
    /**
     * Process a compound dependency
     * @param compoundDependency the compound dependency object
     * @param context the current execution context
     */
    processCompoundDependency(compoundDependency, context) {
        const operator = compoundDependency.operator || rule_config_1.Operator.AND;
        const executionOrder = compoundDependency.executionOrder || rule_config_1.ExecutionOrder.Parallel;
        const response = {
            name: compoundDependency.name,
            hasError: false,
            isSkipped: false,
            isSuccessful: false,
            rules: [],
            startDateTime: moment_1.default.utc().toDate(),
        };
        if (this.options.debug) {
            response.debugContext = {
                root: context.root,
                executionOrder,
                operator,
            };
        }
        const tasks = this.collectDependencyTasks(compoundDependency, context);
        const values = lodash_1.default.values(tasks);
        // let counter = 0;
        const runTask = executionOrder === rule_config_1.ExecutionOrder.Parallel
            ? rxjs_1.forkJoin(tasks).pipe(operators_1.map((results) => {
                const entries = lodash_1.default.entries(results).map(([, result]) => result);
                response.rules = lodash_1.default.map(entries, (result) => result);
                return entries;
            }))
            : rxjs_1.concat(...values).pipe(operators_1.tap((result) => {
                response.rules.push(result);
                // counter ++;
            }), operators_1.toArray());
        return runTask.pipe(operators_1.switchMap((results) => {
            response.completedTime = moment_1.default.utc().toDate();
            response.isSuccessful =
                operator === rule_config_1.Operator.AND
                    ? lodash_1.default.every(results, (result) => result.isSuccessful)
                    : lodash_1.default.some(results, (result) => result.isSuccessful);
            response.hasError = !response.isSuccessful;
            return rxjs_1.of(response);
        }));
    }
    /**
     * execute the root object against a rule
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     * @param params.parentExecutionContext [parent execution context] the parent context of current context
     */
    execute(params) {
        const rule = this.ruleStore[params.ruleName];
        const ruleHash = object_hash_1.default(params.ruleName);
        const objectHash = object_hash_1.default(params.root);
        const contextHash = ruleHash + objectHash;
        const contextId = `${contextHash}${this.options.suppressDuplicateTasks ? '' : lodash_1.default.uniqueId('-')}`;
        let context = this.contextStore[contextId];
        if (!context || this.options.suppressDuplicateTasks === false) {
            context = {
                contextId,
                rule,
                root: params.root,
                _process$: rxjs_1.empty(),
                complete: false,
                contextData: {},
            };
            if (this.options.debug) {
                context.contextData.objectHash = objectHash;
            }
            this.contextStore[contextId] = context;
            if (params.parentExecutionContext) {
                context.parentContext = params.parentExecutionContext;
                (params.parentExecutionContext.childrenContexts = params.parentExecutionContext.childrenContexts || {})[context.contextId] = context;
            }
        }
        else {
            return context._process$;
        }
        const response = {
            rule: params.ruleName,
            hasError: false,
            isSuccessful: false,
            result: undefined,
            debugContext: this.options.debug ?
                {
                    contextId,
                    root: context.root,
                    ruleName: rule.name,
                } : undefined,
        };
        context._process$ = rxjs_1.of(true).pipe(
        // call beforeAction
        operators_1.switchMap((x) => {
            response.startDateTime = moment_1.default.utc().toDate();
            if (rule.beforeAction) {
                return rule.beforeAction(context).pipe(operators_1.tap(() => {
                    if (this.options.debug) {
                        this.logger.debug(`before action executed for rule ${rule.name} - context ${context.contextId}`);
                    }
                }));
            }
            return rxjs_1.of(x);
        }), 
        // execute the main action
        operators_1.switchMap(() => {
            return this.executeAction({
                action: rule.action,
                context,
            });
        }), operators_1.catchError((err) => {
            response.isSuccessful = false;
            response.hasError = true;
            response.error = err;
            response.completedTime = moment_1.default.utc().toDate();
            if (rule.onError) {
                /* if a custom onError handler is specified
                   let it decide if we should replace the the stream
                   or let it fail
                */
                return rule.onError(err, context).pipe(operators_1.tap(() => {
                    /* istanbul ignore next */
                    if (this.options.debug) {
                        this.logger.debug(`onError executed for rule ${rule.name} - context ${context.contextId}`);
                    }
                }));
            }
            return rxjs_1.throwError(err);
        }), operators_1.tap((result) => {
            context.complete = true;
            response.isSuccessful = true;
            response.result = result;
            response.completedTime = moment_1.default.utc().toDate();
        }), 
        // call dependency rules
        operators_1.switchMap(() => {
            if (rule.dependencies && rule.dependencies.rules && rule.dependencies.rules.length) {
                return this.processCompoundDependency(rule.dependencies, context).pipe(operators_1.tap((dependencyReponse) => {
                    response.dependency = dependencyReponse;
                }), operators_1.mapTo(response));
            }
            return rxjs_1.of(response);
        }), 
        // call afterAction
        operators_1.switchMap((response) => {
            if (rule.afterAction) {
                return rule.afterAction(response, context).pipe(operators_1.tap(() => {
                    /* istanbul ignore next */
                    if (this.options.debug) {
                        this.logger.debug(`after action executed for rule ${rule.name} - context ${context.contextId}`);
                    }
                }));
            }
            return rxjs_1.of(response);
        }));
        if (this.options.suppressDuplicateTasks) {
            context._process$ = context._process$.pipe(operators_1.shareReplay(1));
        }
        else {
            context._process$ = context._process$.pipe(operators_1.share());
        }
        return context._process$;
    }
    /* istanbul ignore next */
    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     */
    run(params) {
        return this.execute({ root: params.root, ruleName: params.ruleName });
    }
}
exports.JasperEngine = JasperEngine;
//# sourceMappingURL=engine.js.map