"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JasperEngineRecipe = exports.ExecutionOrder = exports.Operator = void 0;
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
var JasperEngineRecipe;
(function (JasperEngineRecipe) {
    JasperEngineRecipe[JasperEngineRecipe["ValidationRuleEngine"] = 0] = "ValidationRuleEngine";
    JasperEngineRecipe[JasperEngineRecipe["BusinessProcessEngine"] = 1] = "BusinessProcessEngine";
})(JasperEngineRecipe = exports.JasperEngineRecipe || (exports.JasperEngineRecipe = {}));
//# sourceMappingURL=enum.js.map