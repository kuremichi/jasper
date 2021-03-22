"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleNotFoundException = void 0;
class RuleNotFoundException extends Error {
    constructor(ruleName) {
        super(`rule ${ruleName} not found`);
    }
}
exports.RuleNotFoundException = RuleNotFoundException;
//# sourceMappingURL=rule.store.interfafce.js.map