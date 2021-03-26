"use strict";
exports.__esModule = true;
exports.Direction = exports.EngineRecipe = exports.ExecutionOrder = exports.Operator = void 0;
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
var Direction;
(function (Direction) {
    Direction["OutsideIn"] = "OutsideIn";
    Direction["InsideOut"] = "InsideOut";
})(Direction = exports.Direction || (exports.Direction = {}));
//# sourceMappingURL=enum.js.map