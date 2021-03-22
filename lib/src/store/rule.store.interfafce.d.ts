import { Observable } from 'rxjs';
import { Rule } from '../rule';
export interface IRuleStore {
    get(ruleName: string): Observable<Rule | undefined>;
}
export declare class RuleNotFoundException extends Error {
    constructor(ruleName: string);
}
