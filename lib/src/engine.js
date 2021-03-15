"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultEngineOptions = exports.JasperEngine = void 0;
const recipe_1 = require("./recipe");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const rule_config_1 = require("./rule.config");
const jsonata_1 = __importDefault(require("jsonata"));
const object_hash_1 = __importDefault(require("object-hash"));
const lodash_1 = __importDefault(require("lodash"));
const test_rule_store_1 = require("./test.rule.store");
// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = (async () => { }).constructor;
// eslint-disable-next-line require-yield
const GeneratorFunction = function* () {
    return {};
}.constructor;
class JasperEngine {
    constructor(options = exports.DefaultEngineOptions) {
        this.options = options;
        this.contextStore = {};
        this.ruleStore = test_rule_store_1.StaticRuleStore;
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
    processPath(context, path) {
        if (typeof path === 'string') {
            const expression = jsonata_1.default(path);
            const pathObject = expression.evaluate(context.root);
            return rxjs_1.of(pathObject).pipe(operators_1.toArray());
        }
        // if (path instanceof Observable) {
        //     return from(path).pipe(toArray());
        // }
        if (path instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) {
            return rxjs_1.from(path(context)).pipe(operators_1.toArray());
        }
        if (path instanceof Function) {
            return rxjs_1.of(path(context)).pipe(operators_1.toArray());
        }
        return rxjs_1.of([]);
    }
    processCompoundDependency(context, compoundDependency) {
        const operator = compoundDependency.operator || rule_config_1.Operator.AND;
        const response = {
            name: compoundDependency.name,
            hasError: false,
            isSuccessful: false,
            operator,
            rules: [],
        };
        const tasks = lodash_1.default.reduce(compoundDependency.rules, (acc, rule) => {
            if (rule_config_1.isSimpleDependency(rule)) {
                const simpleDependency = rule;
                const simpleDependencyResponse = {
                    name: rule.name,
                    isSkipped: false,
                    rule: rule.rule,
                    hasError: false,
                    isSuccessful: false,
                    result: null,
                    dependencies: undefined,
                };
                const task = this.processPath(context, rule.path).pipe(operators_1.switchMap((pathObjects) => {
                    // TODO: consume every path object
                    return this.execute({
                        root: pathObjects[0],
                        ruleName: simpleDependency.rule,
                        parentExecutionContext: context,
                    });
                }), operators_1.switchMap((r) => {
                    simpleDependencyResponse.result = r.result;
                    simpleDependencyResponse.isSuccessful = r.isSuccessful;
                    simpleDependencyResponse.dependencies = r.dependencies;
                    return rxjs_1.of(simpleDependencyResponse);
                }), operators_1.catchError((err) => {
                    simpleDependencyResponse.error = err;
                    simpleDependencyResponse.hasError = true;
                    simpleDependencyResponse.isSuccessful = false;
                    return rxjs_1.of(simpleDependencyResponse);
                }));
                acc[rule.name] = task;
            }
            else if (rule_config_1.isCompoundDependency(rule)) {
                const childCompoundDependency = rule;
                acc[rule.name] = this.processCompoundDependency(context, childCompoundDependency);
            }
            return acc;
        }, {});
        return rxjs_1.forkJoin(tasks).pipe(operators_1.switchMap((results) => {
            const entries = lodash_1.default.entries(results);
            response.hasError = lodash_1.default.some(entries, ([, result]) => {
                return result.hasError;
            });
            response.isSuccessful =
                operator === rule_config_1.Operator.AND
                    ? lodash_1.default.every(entries, ([, result]) => result.isSuccessful)
                    : lodash_1.default.some(entries, ([, result]) => result.isSuccessful);
            response.rules = lodash_1.default.map(entries, ([name, result]) => {
                return {
                    name,
                    isSkipped: false,
                    rule: result.rule,
                    hasError: result.hasError,
                    error: result.error,
                    isSuccessful: result.isSuccessful,
                    result: result.result,
                    dependencies: result.dependencies,
                };
            });
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
        };
        context.process = rxjs_1.of(true).pipe(operators_1.tap(() => {
            if (rule.beforeAction) {
                if (rule.beforeAction instanceof AsyncFunction &&
                    AsyncFunction !== Function &&
                    AsyncFunction !== GeneratorFunction) {
                    const subscription = rxjs_1.from(rule.beforeAction(context)).subscribe((x) => {
                        console.log(x);
                    }, (e) => {
                        console.log(e);
                    });
                    subscription.unsubscribe();
                }
                else if (rule.beforeAction instanceof Function) {
                    rule.beforeAction(context);
                }
            }
        }), operators_1.switchMap(() => {
            return this.executeAction({
                context,
                action: rule.action,
            }).pipe();
        }), operators_1.tap((result) => {
            context.complete = true;
            response.isSuccessful = true;
            response.result = result;
        }), operators_1.catchError((err) => {
            response.isSuccessful = false;
            response.hasError = true;
            response.error = err;
            /*
                if the 'root' is always evaluated before the dependencies.
            */
            // TODO: call error callback
            return rxjs_1.throwError(err);
        }), operators_1.switchMap(() => {
            if (rule.dependencies && rule.dependencies.rules && rule.dependencies.rules.length) {
                return this.processCompoundDependency(context, rule.dependencies);
            }
            return rxjs_1.of(undefined);
        }), operators_1.tap((dependencyReponse) => {
            response.dependencies = dependencyReponse;
        }), operators_1.tap(() => {
            if (rule.afterAction) {
                if ((rule.afterAction instanceof AsyncFunction &&
                    AsyncFunction !== Function &&
                    AsyncFunction !== GeneratorFunction) === true) {
                    const subscription = rxjs_1.from(rule.afterAction(context)).subscribe((x) => {
                        console.log(x);
                    }, (e) => {
                        console.log(e);
                    });
                    subscription.unsubscribe();
                }
                else if (rule.afterAction instanceof Function) {
                    rule.afterAction(context);
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
}
exports.JasperEngine = JasperEngine;
exports.DefaultEngineOptions = {
    suppressDuplicateTasks: true,
    recipe: recipe_1.JasperEngineRecipe.ValidationRuleEngine,
};
//# sourceMappingURL=engine.js.map