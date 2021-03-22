(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RuleNotFoundException = void 0;
    class RuleNotFoundException extends Error {
        constructor(ruleName) {
            super(`rule ${ruleName} not found`);
        }
    }
    exports.RuleNotFoundException = RuleNotFoundException;
});
//# sourceMappingURL=rule.store.interfafce.js.map