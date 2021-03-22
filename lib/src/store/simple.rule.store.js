var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "rxjs", "lodash"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleRuleStore = void 0;
    const rxjs_1 = require("rxjs");
    const lodash_1 = __importDefault(require("lodash"));
    class SimpleRuleStore {
        constructor(...rules) {
            this.rules = {};
            this.registerRuleArray(rules);
        }
        get(ruleName) {
            return rxjs_1.of(this.rules[ruleName]);
        }
        registerRuleArray(rules, overrideIfExists = false) {
            lodash_1.default.each(rules, (rule) => {
                this.register(rule, overrideIfExists);
            });
        }
        registerRuleDictionary(dictionary, overrideIfExists = false) {
            const configs = lodash_1.default.entries(dictionary);
            lodash_1.default.each(configs, ([ruleName, rule]) => {
                this.register(rule, overrideIfExists, ruleName);
            });
        }
        register(rule, overrideIfExists = false, alternativeRuleName) {
            const ruleName = alternativeRuleName || rule.name;
            const existingRule = this.rules[ruleName];
            if (existingRule && !overrideIfExists) {
                throw new Error(`rule ${ruleName} exists already`);
            }
            this.rules[ruleName] = rule;
        }
    }
    exports.SimpleRuleStore = SimpleRuleStore;
});
//# sourceMappingURL=simple.rule.store.js.map