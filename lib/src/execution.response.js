"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCompositeDependencyResponse = void 0;
function isCompositeDependencyResponse(object) {
    return 'operator' in object && 'rules' in object;
}
exports.isCompositeDependencyResponse = isCompositeDependencyResponse;
//# sourceMappingURL=execution.response.js.map