"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionOrder = exports.Operator = exports.isSimpleDependency = exports.isCompoundDependency = exports.isJasperRule = void 0;
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
    ExecutionOrder[ExecutionOrder["Sequential"] = 0] = "Sequential";
    ExecutionOrder[ExecutionOrder["Parallel"] = 1] = "Parallel";
})(ExecutionOrder = exports.ExecutionOrder || (exports.ExecutionOrder = {}));
//# sourceMappingURL=rule.config.js.map