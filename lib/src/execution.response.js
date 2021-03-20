"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCompositeDependencyExecutionResponse = void 0;
function isCompositeDependencyExecutionResponse(object) {
    return 'operator' in object && 'rules' in object;
}
exports.isCompositeDependencyExecutionResponse = isCompositeDependencyExecutionResponse;
//# sourceMappingURL=execution.response.js.map