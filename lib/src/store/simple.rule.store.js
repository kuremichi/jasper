import { of } from 'rxjs';
import _ from 'lodash';
export class SimpleRuleStore {
    constructor(...rules) {
        this.rules = {};
        this.registerRuleArray(rules);
    }
    get(ruleName) {
        return of(this.rules[ruleName]);
    }
    registerRuleArray(rules, overrideIfExists = false) {
        _.each(rules, (rule) => {
            this.register(rule, overrideIfExists);
        });
    }
    registerRuleDictionary(dictionary, overrideIfExists = false) {
        const configs = _.entries(dictionary);
        _.each(configs, ([ruleName, rule]) => {
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
//# sourceMappingURL=simple.rule.store.js.map