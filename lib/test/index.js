"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_1 = require("../src/engine");
const test_sequential_store_1 = require("./test.sequential.store");
const engine = new engine_1.JasperEngine(test_sequential_store_1.StaticRuleStore);
engine.run({ root: {}, ruleName: 'test rule 3' }).subscribe((r) => {
    console.log(JSON.stringify(r));
    console.log('completed');
});
//# sourceMappingURL=index.js.map