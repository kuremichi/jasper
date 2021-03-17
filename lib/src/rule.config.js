"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultEngineOptions = exports.ExecutionOrder = exports.Operator = exports.isSimpleDependency = exports.isCompoundDependency = exports.isJasperRule = void 0;
const recipe_1 = require("./recipe");
function isJasperRule(object) {
    return 'name' in object && 'action' in object;
}
exports.isJasperRule = isJasperRule;
function isCompoundDependency(object) {
    return 'name' in object && 'rules' in object;
}
exports.isCompoundDependency = isCompoundDependency;
function isSimpleDependency(object) {
    return 'name' in object && 'path' in object && 'rule' in object;
}
exports.isSimpleDependency = isSimpleDependency;
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
exports.DefaultEngineOptions = {
    suppressDuplicateTasks: true,
    recipe: recipe_1.JasperEngineRecipe.ValidationRuleEngine,
    debug: false,
};
//# sourceMappingURL=rule.config.js.map