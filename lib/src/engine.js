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
// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = (async () => { }).constructor;
// eslint-disable-next-line require-yield
const GeneratorFunction = function* () {
    return {};
}.constructor;
class JasperEngine {
    constructor(ruleStore, options = rule_config_1.DefaultEngineOptions) {
        this.options = options;
        this.contextStore = {};
        this.ruleStore = ruleStore;
    }
    executeAction({ context, action, }) {
        if (typeof action === 'string' || action instanceof String) {
            const expression = jsonata_1.default(action);
            return rxjs_1.of(expression.evaluate(context.root));
        }
        if (action instanceof rxjs_1.Observable) {
            return rxjs_1.from(action).pipe(operators_1.toArray());
        }
        if (action instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) {
            return rxjs_1.from(action(context.root));
        }
        if (action instanceof Function) {
            return rxjs_1.of(action(context.root));
        }
        return rxjs_1.of(null);
    }
    processPath(path, context) {
        if (typeof path === 'string') {
            const expression = jsonata_1.default(path);
            const pathObject = expression.evaluate(context.root);
            return rxjs_1.of(pathObject).pipe(operators_1.toArray(), operators_1.map(arr => {
                return lodash_1.default.flatten(arr);
            }));
        }
        if (path instanceof rxjs_1.Observable) {
            return rxjs_1.from(path).pipe(operators_1.toArray(), operators_1.map(arr => {
                return lodash_1.default.flatten(arr);
            }));
        }
        if (path instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) {
            return rxjs_1.from(path(context)).pipe(operators_1.toArray(), operators_1.map(arr => {
                return lodash_1.default.flatten(arr);
            }));
        }
        if (path instanceof Function) {
            return rxjs_1.of(path(context)).pipe(operators_1.toArray(), operators_1.map(arr => {
                return lodash_1.default.flatten(arr);
            }));
        }
        return rxjs_1.of([]);
    }
    processSimpleDependency(accumulator, simpleDependency, context) {
        const registerMatchesHandler = this.processPath(simpleDependency.path, context).subscribe((pathObjects) => {
            lodash_1.default.each(pathObjects, (pathObject, index) => {
                const simpleDependencyResponse = {
                    name: `${simpleDependency.name}`,
                    isSkipped: false,
                    rule: simpleDependency.rule,
                    executionOrder: simpleDependency.executionOrder || rule_config_1.ExecutionOrder.Parallel,
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
                    simpleDependencyResponse.dependencies = r.dependencies;
                    simpleDependencyResponse.completedTime = r.completedTime;
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
                executionOrder: simpleDependency.executionOrder || rule_config_1.ExecutionOrder.Parallel,
                error: err,
                hasError: true,
                isSuccessful: false,
                result: null,
            };
            accumulator[`${simpleDependency.name}`] = rxjs_1.of(errReponse);
        });
        registerMatchesHandler.unsubscribe();
    }
    processCompoundDependency(compoundDependency, context) {
        const operator = compoundDependency.operator || rule_config_1.Operator.AND;
        const executionOrder = compoundDependency.executionOrder || rule_config_1.ExecutionOrder.Parallel;
        const response = {
            name: compoundDependency.name,
            hasError: false,
            isSuccessful: false,
            operator,
            executionOrder: compoundDependency.executionOrder || rule_config_1.ExecutionOrder.Parallel,
            rules: [],
            startDateTime: moment_1.default.utc().toDate(),
        };
        const tasks = lodash_1.default.reduce(compoundDependency.rules, (acc, rule) => {
            if (rule_config_1.isSimpleDependency(rule)) {
                this.processSimpleDependency(acc, rule, context);
            }
            else if (rule_config_1.isCompoundDependency(rule)) {
                const childCompoundDependency = rule;
                const compoundDependencyResponse = {
                    name: childCompoundDependency.name,
                    hasError: false,
                    isSuccessful: false,
                    operator,
                    executionOrder: childCompoundDependency.executionOrder || rule_config_1.ExecutionOrder.Parallel,
                    rules: [],
                };
                acc[rule.name] = rxjs_1.of(true).pipe(operators_1.switchMap(() => {
                    compoundDependencyResponse.startDateTime = moment_1.default.utc().toDate();
                    return this.processCompoundDependency(childCompoundDependency, context);
                }), operators_1.switchMap((r) => {
                    compoundDependencyResponse.isSuccessful = r.isSuccessful;
                    compoundDependencyResponse.rules = r.rules;
                    compoundDependencyResponse.completedTime = r.completedTime;
                    return rxjs_1.of(compoundDependencyResponse);
                }));
            }
            return acc;
        }, {});
        const values = lodash_1.default.values(tasks);
        // let counter = 0;
        const runTask = executionOrder === rule_config_1.ExecutionOrder.Parallel ?
            rxjs_1.forkJoin(tasks).pipe(operators_1.map((results) => {
                const entries = lodash_1.default.entries(results).map(([, result]) => result);
                response.rules = lodash_1.default.map(entries, (result) => result);
                return entries;
            })) :
            rxjs_1.concat(...values).pipe(operators_1.tap((result) => {
                response.rules.push(result);
                // counter ++;
            }), operators_1.toArray());
        return runTask.pipe(operators_1.switchMap((results) => {
            response.completedTime = moment_1.default.utc().toDate();
            response.hasError = lodash_1.default.some(results, (result) => {
                return result.hasError;
            });
            response.isSuccessful =
                operator === rule_config_1.Operator.AND
                    ? lodash_1.default.every(results, (result) => result.isSuccessful)
                    : lodash_1.default.some(results, (result) => result.isSuccessful);
            return rxjs_1.of(response);
        }));
    }
    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     * @param params.parentExecutionContext [parent execution context] the parent context of current context
     */
    execute(params) {
        const rule = this.ruleStore[params.ruleName];
        const contextId = `${params.ruleName}-${object_hash_1.default(params.root)}`;
        let context = this.contextStore[contextId];
        if (!context) {
            context = {
                contextId,
                options: this.options,
                rule,
                root: params.root,
                process: rxjs_1.empty(),
                complete: false,
            };
            console.debug(`adding context ${contextId}`);
            this.contextStore[contextId] = context;
            if (params.parentExecutionContext) {
                context.parentContext = params.parentExecutionContext;
                (params.parentExecutionContext.childrenContexts = params.parentExecutionContext.childrenContexts || {})[context.contextId] = context;
            }
        }
        else {
            return context.process;
        }
        const response = {
            rule: params.ruleName,
            hasError: false,
            isSuccessful: false,
            result: undefined,
            startDateTime: moment_1.default.utc().toDate(),
        };
        context.process = rxjs_1.of(true).pipe(
        // call beforeAction
        operators_1.tap(() => {
            if (rule.beforeAction) {
                if (rule.beforeAction instanceof AsyncFunction &&
                    AsyncFunction !== Function &&
                    AsyncFunction !== GeneratorFunction) {
                    const subscription = rxjs_1.from(rule.beforeAction(context)).subscribe(
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    () => { }, (error) => {
                        console.error(error);
                    });
                    subscription.unsubscribe();
                }
                else if (rule.beforeAction instanceof Function) {
                    try {
                        rule.beforeAction(context);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            }
        }), 
        // execute the main action
        operators_1.switchMap(() => {
            return this.executeAction({
                context,
                action: rule.action,
            });
        }), operators_1.tap((result) => {
            context.complete = true;
            response.isSuccessful = true;
            response.result = result;
            response.completedTime = moment_1.default.utc().toDate();
        }), operators_1.catchError((err) => {
            response.isSuccessful = false;
            response.hasError = true;
            response.error = err;
            response.completedTime = moment_1.default.utc().toDate();
            if (rule.onError) {
                if ((rule.onError instanceof AsyncFunction &&
                    AsyncFunction !== Function &&
                    AsyncFunction !== GeneratorFunction) === true) {
                    const subscription = rxjs_1.from(rule.onError(err, context)).subscribe(
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    () => { }, (error) => {
                        console.error(error);
                    });
                    subscription.unsubscribe();
                }
                else if (rule.onError instanceof Function) {
                    try {
                        rule.onError(err, context);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            }
            return rxjs_1.throwError(err);
        }), 
        // call dependency rules
        operators_1.switchMap(() => {
            if (rule.dependencies && rule.dependencies.rules && rule.dependencies.rules.length) {
                return this.processCompoundDependency(rule.dependencies, context);
            }
            return rxjs_1.of(undefined);
        }), operators_1.tap((dependencyReponse) => {
            response.dependencies = dependencyReponse;
        }), 
        // call afterAction
        operators_1.tap(() => {
            if (rule.afterAction) {
                if ((rule.afterAction instanceof AsyncFunction &&
                    AsyncFunction !== Function &&
                    AsyncFunction !== GeneratorFunction) === true) {
                    const subscription = rxjs_1.from(rule.afterAction(context)).subscribe(
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    () => { }, (error) => {
                        console.error(error);
                    });
                    subscription.unsubscribe();
                }
                else if (rule.afterAction instanceof Function) {
                    try {
                        rule.afterAction(context);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            }
        }), operators_1.switchMap(() => {
            return rxjs_1.of(response);
        }));
        if (this.options.suppressDuplicateTasks) {
            context.process = context.process.pipe(operators_1.shareReplay(1));
        }
        else {
            context.process = context.process.pipe(operators_1.share());
        }
        return context.process;
    }
    /**
     * @param params
     * @param params.root the object to evaluate
     * @param params.ruleName the rule name to evaluate against
     */
    run(params) {
        return this.execute(params);
    }
}
exports.JasperEngine = JasperEngine;
//# sourceMappingURL=engine.js.map