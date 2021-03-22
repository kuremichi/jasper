import { IRuleStore } from './rule.store.interfafce';
import { Observable } from 'rxjs';
import { Rule } from '../rule';
export declare class SimpleRuleStore implements IRuleStore {
    private rules;
    constructor(...rules: Rule[]);
    get(ruleName: string): Observable<Rule | undefined>;
    registerRuleArray(rules: Rule[], overrideIfExists?: boolean): void;
    registerRuleDictionary(dictionary: Record<string, Rule>, overrideIfExists?: boolean): void;
    register(rule: Rule, overrideIfExists?: boolean, alternativeRuleName?: string): void;
}
