"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.SimpleRuleStore = void 0;
var rxjs_1 = require("rxjs");
var lodash_1 = __importDefault(require("lodash"));
var SimpleRuleStore = (function () {
    function SimpleRuleStore() {
        var rules = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rules[_i] = arguments[_i];
        }
        this.rules = {};
        this.registerRuleArray(rules);
    }
    SimpleRuleStore.prototype.get = function (ruleName) {
        return rxjs_1.of(this.rules[ruleName]);
    };
    SimpleRuleStore.prototype.registerRuleArray = function (rules, overrideIfExists) {
        var _this = this;
        if (overrideIfExists === void 0) { overrideIfExists = false; }
        lodash_1["default"].each(rules, function (rule) {
            _this.register(rule, overrideIfExists);
        });
    };
    SimpleRuleStore.prototype.registerRuleDictionary = function (dictionary, overrideIfExists) {
        var _this = this;
        if (overrideIfExists === void 0) { overrideIfExists = false; }
        var configs = lodash_1["default"].entries(dictionary);
        lodash_1["default"].each(configs, function (_a) {
            var rule = _a[1];
            _this.register(rule, overrideIfExists, rule.name);
        });
    };
    SimpleRuleStore.prototype.register = function (rule, overrideIfExists, alternativeRuleName) {
        if (overrideIfExists === void 0) { overrideIfExists = false; }
        var ruleName = alternativeRuleName || rule.name;
        var existingRule = this.rules[ruleName];
        if (existingRule && !overrideIfExists) {
            throw new Error("rule " + ruleName + " exists already");
        }
        this.rules[ruleName] = rule;
    };
    return SimpleRuleStore;
}());
exports.SimpleRuleStore = SimpleRuleStore;
//# sourceMappingURL=simple.rule.store.js.map