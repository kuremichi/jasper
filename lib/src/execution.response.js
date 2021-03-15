"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCompoundDependencyExecutionResponse = void 0;
function isCompoundDependencyExecutionResponse(object) {
    return 'operator' in object && 'rules' in object;
}
exports.isCompoundDependencyExecutionResponse = isCompoundDependencyExecutionResponse;
//# sourceMappingURL=execution.response.js.map