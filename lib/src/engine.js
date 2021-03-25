"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.JasperEngine = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var jsonata_1 = __importDefault(require("jsonata"));
var object_hash_1 = __importDefault(require("object-hash"));
var lodash_1 = __importDefault(require("lodash"));
var engine_option_1 = require("./engine.option");
var simple_dependency_1 = require("./dependency/simple.dependency");
var enum_1 = require("./enum");
var rule_store_interfafce_1 = require("./store/rule.store.interfafce");
var ILogger_1 = require("./ILogger");
var JasperEngine = (function () {
    function JasperEngine(_a) {
        var ruleStore = _a.ruleStore, options = _a.options, logger = _a.logger;
        this.options = options || engine_option_1.DefaultEngineOptions;
        this.contextStore = {};
        this.ruleStore = ruleStore;
        this.logger = logger || ILogger_1.DummyLogger;
    }
    JasperEngine.prototype.executeAction = function (params) {
        if (typeof params.action === 'string' || params.action instanceof String) {
            var expression = jsonata_1["default"](params.action);
            var result = expression.evaluate(params.context.root);
            return rxjs_1.of(result);
        }
        if (params.action instanceof Function) {
            return params.action(params.context);
        }
        return rxjs_1.of(null);
    };
    JasperEngine.prototype.processExpression = function (expression, context) {
        if (typeof expression === 'string') {
            var jsonataExpression = jsonata_1["default"](expression);
            var expressionObject = jsonataExpression.evaluate(context.root);
            return rxjs_1.of(expressionObject).pipe(operators_1.toArray(), operators_1.map(function (arr) {
                return lodash_1["default"].chain(lodash_1["default"].flatten(arr))
                    .filter(function (expressionObject) { return expressionObject; })
                    .value();
            }));
        }
        if (expression instanceof Function) {
            return expression(context).pipe(operators_1.toArray(), operators_1.map(function (arr) {
                return lodash_1["default"].chain(lodash_1["default"].flatten(arr))
                    .filter(function (expressionObject) { return expressionObject; })
                    .value();
            }));
        }
        return rxjs_1.of([]);
    };
    JasperEngine.prototype.processCompositeDependency = function (compositeDependency, context) {
        var _this = this;
        var operator = compositeDependency.operator || enum_1.Operator.AND;
        var executionOrder = compositeDependency.executionOrder || enum_1.ExecutionOrder.Parallel;
        var dependencyResponse = {
            name: compositeDependency.name,
            hasError: false,
            errors: [],
            isSkipped: false,
            isSuccessful: true,
            rules: [],
            startTime: new Date()
        };
        if (this.options.debug) {
            dependencyResponse.debugContext = {
                root: context.root,
                executionOrder: executionOrder,
                operator: operator
            };
        }
        return (compositeDependency.when
            ? this.processExpression(compositeDependency.when, context).pipe(operators_1.switchMap(function (whenResult) {
                var w = lodash_1["default"].get(whenResult, '[0]', false);
                return rxjs_1.of(w);
            }))
            : rxjs_1.of(true)).pipe(operators_1.switchMap(function (run) {
            dependencyResponse.isSkipped = !run;
            if (dependencyResponse.isSkipped) {
                if (_this.options.debug) {
                    dependencyResponse.debugContext = {
                        root: context.root,
                        whenDescription: compositeDependency.whenDescription
                    };
                }
                return rxjs_1.of(dependencyResponse);
            }
            return (compositeDependency.beforeDependency
                ? compositeDependency.beforeDependency(context)
                : rxjs_1.of(null)).pipe(operators_1.switchMap(function (beforeDependencyResult) {
                var tasks = lodash_1["default"].map(compositeDependency.rules, function (rule) {
                    if (simple_dependency_1.isSimpleDependency(rule)) {
                        return _this.processSimpleDependency(rule, context);
                    }
                    return _this.processCompositeDependency(rule, context);
                });
                return (executionOrder == enum_1.ExecutionOrder.Sequential
                    ? rxjs_1.concat.apply(void 0, tasks) : rxjs_1.from(tasks).pipe(operators_1.mergeAll(compositeDependency.maxConcurrency))).pipe(operators_1.toArray(), operators_1.switchMap(function (responses) {
                    dependencyResponse.rules = responses;
                    return rxjs_1.of(dependencyResponse);
                }));
            }), operators_1.switchMap(function () {
                return compositeDependency.afterDependency
                    ? compositeDependency.afterDependency(context)
                    : rxjs_1.of(null);
            }), operators_1.switchMap(function (afterDependencyResult) {
                dependencyResponse.isSuccessful =
                    operator === enum_1.Operator.AND
                        ? lodash_1["default"].every(dependencyResponse.rules, function (result) {
                            return result.isSuccessful;
                        })
                        : lodash_1["default"].some(dependencyResponse.rules, function (result) {
                            return result.isSuccessful;
                        });
                dependencyResponse.hasError = !dependencyResponse.isSuccessful;
                return rxjs_1.of(dependencyResponse);
            }));
        }), operators_1.catchError(function (err) {
            dependencyResponse.hasError = true;
            dependencyResponse.errors.push(err);
            dependencyResponse.isSuccessful = false;
            return compositeDependency.onDependencyError
                ? compositeDependency.onDependencyError(err, dependencyResponse, context)
                : rxjs_1.of(dependencyResponse);
        }));
    };
    JasperEngine.prototype.processSimpleDependency = function (simpleDependency, context) {
        var _this = this;
        var dependencyResponse = {
            name: "" + simpleDependency.name,
            isSkipped: false,
            rule: simpleDependency.rule,
            hasError: false,
            isSuccessful: true,
            errors: [],
            matches: []
        };
        return (simpleDependency.when
            ? this.processExpression(simpleDependency.when, context).pipe(operators_1.switchMap(function (whenResult) {
                var w = lodash_1["default"].get(whenResult, '[0]', false);
                return rxjs_1.of(w);
            }))
            : rxjs_1.of(true)).pipe(operators_1.switchMap(function (run) {
            dependencyResponse.isSkipped = !run;
            if (dependencyResponse.isSkipped) {
                if (_this.options.debug) {
                    dependencyResponse.debugContext = {
                        root: context.root,
                        whenDescription: simpleDependency.whenDescription
                    };
                }
                return rxjs_1.of(dependencyResponse);
            }
            return (simpleDependency.beforeDependency ? simpleDependency.beforeDependency(context) : rxjs_1.of(null)).pipe(operators_1.switchMap(function (beforeDependencyResult) {
                return _this.processExpression(simpleDependency.path, context).pipe(operators_1.switchMap(function (pathObjects) {
                    var executeOrder = simpleDependency.executionOrder || enum_1.ExecutionOrder.Parallel;
                    var tasks = lodash_1["default"].map(pathObjects, function (pathObject, index) {
                        var executionResponse = {
                            name: "" + simpleDependency.name,
                            rule: simpleDependency.rule,
                            hasError: false,
                            isSuccessful: true,
                            index: index,
                            result: undefined
                        };
                        var task = rxjs_1.of(pathObject).pipe(operators_1.switchMap(function (pathObject) {
                            executionResponse.startTime = new Date();
                            return simpleDependency.beforeEach
                                ? simpleDependency.beforeEach(pathObject, index, context)
                                : rxjs_1.of(null);
                        }), operators_1.switchMap(function (beforeEachResult) {
                            return _this.execute({
                                root: pathObject,
                                ruleName: simpleDependency.rule,
                                parentExecutionContext: context
                            });
                        }), operators_1.tap(function (r) {
                            lodash_1["default"].merge(executionResponse, r);
                            if (_this.options.debug) {
                                executionResponse.debugContext = r.debugContext;
                                executionResponse.debugContext.executionOrder =
                                    simpleDependency.executionOrder || enum_1.ExecutionOrder.Parallel;
                                executionResponse.debugContext.whenDescription =
                                    simpleDependency.whenDescription;
                            }
                        }), operators_1.switchMap(function (response) {
                            if (executionResponse.hasError &&
                                executionResponse.error &&
                                simpleDependency.onEachError) {
                                return simpleDependency.onEachError(response.error, executionResponse, context);
                            }
                            return rxjs_1.of(dependencyResponse);
                        }), operators_1.switchMap(function () {
                            return simpleDependency.afterEach
                                ? simpleDependency
                                    .afterEach(pathObject, index, context)
                                    .pipe(operators_1.switchMapTo(rxjs_1.of(executionResponse)))
                                : rxjs_1.of(executionResponse);
                        }), operators_1.tap(function () {
                            executionResponse.completeTime = new Date();
                            dependencyResponse.matches.push(executionResponse);
                        }), operators_1.catchError(function (err) {
                            executionResponse.hasError = true;
                            executionResponse.error = err;
                            executionResponse.isSuccessful = false;
                            executionResponse.completeTime = new Date();
                            return rxjs_1.of(executionResponse);
                        }));
                        return task;
                    });
                    return executeOrder == enum_1.ExecutionOrder.Sequential
                        ? rxjs_1.concat.apply(void 0, tasks) : rxjs_1.from(tasks).pipe(operators_1.mergeAll(simpleDependency.maxConcurrency));
                }), operators_1.toArray(), operators_1.switchMap(function (responses) {
                    return (simpleDependency.afterDependency
                        ? simpleDependency.afterDependency(context).pipe(operators_1.switchMap(function (afterDependencyResult) {
                            return rxjs_1.of(responses);
                        }))
                        : rxjs_1.of(responses)).pipe(operators_1.switchMap(function (responses) {
                        dependencyResponse.completeTime = new Date();
                        var operator = simpleDependency.operator || enum_1.Operator.AND;
                        dependencyResponse.isSuccessful =
                            operator === enum_1.Operator.AND
                                ? lodash_1["default"].every(responses, function (result) { return result.isSuccessful; })
                                : lodash_1["default"].some(responses, function (result) { return result.isSuccessful; });
                        var executionErrors = lodash_1["default"].chain(responses)
                            .filter(function (response) { return response.hasError && response.error; })
                            .map(function (response) { return response.error; })
                            .value();
                        dependencyResponse.errors = lodash_1["default"].concat(dependencyResponse.errors, executionErrors);
                        dependencyResponse.hasError = dependencyResponse.errors.length > 0;
                        dependencyResponse.matches = lodash_1["default"].orderBy(dependencyResponse.matches, ['index'], ['asc']);
                        return rxjs_1.of(dependencyResponse);
                    }));
                }));
            }));
        }), operators_1.catchError(function (err) {
            dependencyResponse.hasError = true;
            dependencyResponse.isSuccessful = false;
            dependencyResponse.completeTime = new Date();
            return simpleDependency.onDependencyError
                ? simpleDependency.onDependencyError(err, dependencyResponse, context)
                : rxjs_1.of(dependencyResponse).pipe(operators_1.tap(function (dependencyResponse) {
                    dependencyResponse.errors.push(err);
                }));
        }));
    };
    JasperEngine.prototype.execute = function (params) {
        var _this = this;
        var debugContext = this.options.debug
            ?
                {
                    contextId: '',
                    root: params.root,
                    ruleName: params.ruleName
                }
            : undefined;
        var response = {
            rule: params.ruleName,
            hasError: false,
            isSuccessful: true,
            result: undefined,
            debugContext: debugContext
        };
        return this.ruleStore.get(params.ruleName).pipe(operators_1.catchError(function (err) {
            response.error = err;
            return rxjs_1.of(undefined);
        }), operators_1.switchMap(function (rule) {
            if (!rule) {
                response.error = response.error || new rule_store_interfafce_1.RuleNotFoundException(params.ruleName);
                response.hasError = true;
                response.isSuccessful = false;
                return rxjs_1.of(response);
            }
            return rxjs_1.of(rule).pipe(operators_1.switchMap(function (rule) {
                var ruleHash = object_hash_1["default"](params.ruleName);
                var objectHash = object_hash_1["default"](rule.uniqueBy ? rule.uniqueBy(params.root) : params.root);
                var contextHash = ruleHash + objectHash;
                var dedupId = _this.options.suppressDuplicateTasks ? '' : "-" + lodash_1["default"].random(0, 10000);
                var contextId = "" + contextHash + dedupId;
                var context = _this.contextStore[contextId];
                if (!context || _this.options.suppressDuplicateTasks !== true) {
                    response.metadata = rule.metadata;
                    if (debugContext) {
                        debugContext.contextId = contextId;
                    }
                    context = {
                        contextId: contextId,
                        rule: rule,
                        root: params.root,
                        _process$: rxjs_1.of(null),
                        complete: false,
                        contextData: {},
                        response: response
                    };
                    if (_this.options.debug) {
                        context.contextData.objectHash = objectHash;
                    }
                    _this.contextStore[contextId] = context;
                    if (params.parentExecutionContext) {
                        context.parentContext = params.parentExecutionContext;
                        (params.parentExecutionContext.childrenContexts =
                            params.parentExecutionContext.childrenContexts || {})[context.contextId] = context;
                    }
                    context._process$ = rxjs_1.of(true).pipe(operators_1.switchMap(function () {
                        context.response.startTime = new Date();
                        if (rule.beforeAction) {
                            return rule.beforeAction(context).pipe(operators_1.tap(function () {
                                if (_this.options.debug) {
                                    _this.logger.debug("before action executed for rule " + rule.name + " - context " + context.contextId);
                                }
                            }));
                        }
                        return rxjs_1.of(null);
                    }), operators_1.switchMap(function () {
                        if (rule.action) {
                            return _this.executeAction({
                                action: rule.action,
                                context: context
                            });
                        }
                        return _this.options.recipe === enum_1.EngineRecipe.BusinessProcessEngine
                            ? rxjs_1.of(null)
                            : rxjs_1.of(true);
                    }), operators_1.tap(function (result) {
                        context.complete = true;
                        context.response.isSuccessful = true;
                        context.response.result = result;
                        context.response.completeTime = new Date();
                    }), operators_1.switchMap(function () {
                        return rule.dependencies
                            ? _this.processCompositeDependency(rule.dependencies, context).pipe(operators_1.tap(function (dependencyResponse) {
                                context.response.dependency = dependencyResponse;
                                context.response.isSuccessful =
                                    context.response.isSuccessful && dependencyResponse.isSuccessful;
                            }), operators_1.switchMapTo(rxjs_1.of(context.response)))
                            : rxjs_1.of(context.response);
                    }), operators_1.switchMap(function (response) {
                        if (_this.options.recipe === enum_1.EngineRecipe.ValidationRuleEngine) {
                            response.isSuccessful = response.isSuccessful && response.result === true;
                        }
                        if (rule.afterAction) {
                            return rule.afterAction(context).pipe(operators_1.tap(function () {
                                if (_this.options.debug) {
                                    _this.logger.debug("after action executed for rule " + rule.name + " - context " + context.contextId);
                                }
                            }), operators_1.switchMapTo(rxjs_1.of(response)));
                        }
                        return rxjs_1.of(response);
                    }), operators_1.catchError(function (err) {
                        context.response.isSuccessful = false;
                        context.response.hasError = true;
                        context.response.error = err;
                        context.response.completeTime = new Date();
                        if (rule.onError) {
                            if (typeof rule.onError === 'string') {
                                _this.logger.error(err);
                                try {
                                    var errExpression = jsonata_1["default"](rule.onError);
                                    var result = errExpression.evaluate(context.root);
                                    context.response.error = result;
                                }
                                catch (error) {
                                    context.response.error = error;
                                }
                                return rxjs_1.of(context.response);
                            }
                            return rule.onError(err, context).pipe(operators_1.tap(function () {
                                if (_this.options.debug) {
                                    _this.logger.debug("onError executed for rule " + rule.name + " - context " + context.contextId);
                                }
                            }), operators_1.switchMapTo(rxjs_1.of(context.response)));
                        }
                        return rxjs_1.of(context.response);
                    }));
                    if (_this.options.suppressDuplicateTasks) {
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
    };
    JasperEngine.prototype.run = function (params) {
        return this.execute({ root: params.root, ruleName: params.ruleName });
    };
    return JasperEngine;
}());
exports.JasperEngine = JasperEngine;
//# sourceMappingURL=engine.js.map