"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSimpleDependency = void 0;
function isSimpleDependency(object) {
    return 'name' in object && 'path' in object && 'rule' in object;
}
exports.isSimpleDependency = isSimpleDependency;
//# sourceMappingURL=simple.dependency.js.map