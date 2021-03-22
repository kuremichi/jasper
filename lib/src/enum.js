"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineRecipe = exports.ExecutionOrder = exports.Operator = void 0;
var Operator;
(function (Operator) {
    Operator["AND"] = "AND";
    Operator["OR"] = "OR";
})(Operator = exports.Operator || (exports.Operator = {}));
var ExecutionOrder;
(function (ExecutionOrder) {
    ExecutionOrder["Sequential"] = "Sequential";
    ExecutionOrder["Parallel"] = "Parallel";
})(ExecutionOrder = exports.ExecutionOrder || (exports.ExecutionOrder = {}));
var EngineRecipe;
(function (EngineRecipe) {
    EngineRecipe[EngineRecipe["ValidationRuleEngine"] = 0] = "ValidationRuleEngine";
    EngineRecipe[EngineRecipe["BusinessProcessEngine"] = 1] = "BusinessProcessEngine";
})(EngineRecipe = exports.EngineRecipe || (exports.EngineRecipe = {}));
//# sourceMappingURL=enum.js.map