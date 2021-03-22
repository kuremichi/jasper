(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./enum"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultEngineOptions = void 0;
    const enum_1 = require("./enum");
    exports.DefaultEngineOptions = {
        suppressDuplicateTasks: false,
        recipe: enum_1.EngineRecipe.BusinessProcessEngine,
        debug: false,
    };
});
//# sourceMappingURL=engine.option.js.map