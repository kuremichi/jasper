import { IRuleStore } from './rule.store.interfafce';
import { Observable } from 'rxjs';
import { Rule } from '../rule';
export declare class SimpleRuleStore implements IRuleStore {
    private rules;
    constructor(...rules: Rule<any>[]);
    get(ruleName: string): Observable<Rule<any> | undefined>;
    registerRuleArray(rules: Rule<any>[], overrideIfExists?: boolean): void;
    registerRuleDictionary(dictionary: Record<string, Rule<any>>, overrideIfExists?: boolean): void;
    register<T>(rule: Rule<T>, overrideIfExists?: boolean, alternativeRuleName?: string): void;
}
