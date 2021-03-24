"use strict";
exports.__esModule = true;
exports.isSimpleDependency = void 0;
function isSimpleDependency(object) {
    return 'name' in object && 'path' in object && 'rule' in object;
}
exports.isSimpleDependency = isSimpleDependency;
//# sourceMappingURL=simple.dependency.js.map