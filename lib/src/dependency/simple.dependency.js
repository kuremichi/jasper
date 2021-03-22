(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isSimpleDependency = void 0;
    function isSimpleDependency(object) {
        return 'name' in object && 'path' in object && 'rule' in object;
    }
    exports.isSimpleDependency = isSimpleDependency;
});
//# sourceMappingURL=simple.dependency.js.map