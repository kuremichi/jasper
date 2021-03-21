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
    /*
        use this recipe if you want to perform validation against an object that will recursively validate all its children elements based
        on the rule specified.
    */
    JasperEngineRecipe[JasperEngineRecipe["ValidationRuleEngine"] = 0] = "ValidationRuleEngine";
    /*
        use this recipe if perform a series of actions depending on the business process rule
    */
    JasperEngineRecipe[JasperEngineRecipe["BusinessProcessEngine"] = 1] = "BusinessProcessEngine";
})(JasperEngineRecipe = exports.JasperEngineRecipe || (exports.JasperEngineRecipe = {}));
//# sourceMappingURL=enum.js.map