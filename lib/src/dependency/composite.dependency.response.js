"use strict";
exports.__esModule = true;
exports.isCompositeDependencyResponse = void 0;
function isCompositeDependencyResponse(object) {
    return 'operator' in object && 'rules' in object;
}
exports.isCompositeDependencyResponse = isCompositeDependencyResponse;
//# sourceMappingURL=composite.dependency.response.js.map