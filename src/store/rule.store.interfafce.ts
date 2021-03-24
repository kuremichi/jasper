/* istanbul ignore file */

import { Observable } from 'rxjs';
import { Rule } from '../rule';

export interface IRuleStore {
    get(ruleName: string): Observable<Rule<any> | undefined>;
}

export class RuleNotFoundException extends Error {
    constructor(ruleName: string) {
        super(`rule ${ruleName} not found`)
    }
}
