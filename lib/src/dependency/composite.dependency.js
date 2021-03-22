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
    exports.isCompositeDependency = void 0;
    function isCompositeDependency(object) {
        return 'name' in object && 'rules' in object;
    }
    exports.isCompositeDependency = isCompositeDependency;
});
//# sourceMappingURL=composite.dependency.js.map