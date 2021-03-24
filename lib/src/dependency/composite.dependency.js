"use strict";
exports.__esModule = true;
exports.isCompositeDependency = void 0;
function isCompositeDependency(object) {
    return 'name' in object && 'rules' in object;
}
exports.isCompositeDependency = isCompositeDependency;
//# sourceMappingURL=composite.dependency.js.map