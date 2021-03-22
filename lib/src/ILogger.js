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
    exports.DummyLogger = void 0;
    exports.DummyLogger = {
        log: (_message) => { },
        error: (_message) => { },
        warn: (_message) => { },
        debug: (_message) => { },
        trace: (_message) => { },
    };
});
//# sourceMappingURL=ILogger.js.map