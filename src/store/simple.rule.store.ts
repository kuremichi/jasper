import { IRuleStore } from './rule.store.interfafce';
import { Observable, of } from 'rxjs';
import { Rule } from '../rule';
import _ from 'lodash';

/**
 * a simple rule store implementation that keeps a local copy of rules
 */
export class SimpleRuleStore implements IRuleStore {
    private rules: Record<string, Rule>;

    constructor(...rules: Rule[]) {
        this.rules = {};

        this.registerRuleArray(rules);
    }

    /**
     * 
     * @param ruleName 
     */
    get(ruleName: string): Observable<Rule | undefined> {
        return of(this.rules[ruleName]);
    }


    /**
     * 
     * @param rules 
     * @param overrideIfExists 
     */
    registerRuleArray(rules: Rule[], overrideIfExists = false): void {
        _.each(rules, rule => {
           this.register(rule, overrideIfExists);
        });
    }

    /**
     * 
     * @param dictionary
     * @param overrideIfExists 
     */
    registerRuleDictionary(dictionary: Record<string, Rule>, overrideIfExists = false): void {
        const configs = _.entries(dictionary);
        _.each(configs, ([ruleName, rule]: [string, Rule]) => {
            this.register(rule, overrideIfExists, ruleName);
        });
    }

    /**
     * 
     * @param rule 
     * @param overrideIfExists 
     * @param alternativeRuleName 
     */
    register(rule: Rule, overrideIfExists = false, alternativeRuleName?: string): void {
        const ruleName = alternativeRuleName || rule.name;
        const existingRule = this.rules[ruleName];
        if (existingRule && !overrideIfExists) {
            throw new Error(`rule ${ruleName} exists already`);
        }

        this.rules[ruleName] = rule;
    }
}