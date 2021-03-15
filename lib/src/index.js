"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_1 = require("./engine");
const test_rule_store_1 = require("./test.rule.store");
const engine = new engine_1.JasperEngine(test_rule_store_1.StaticRuleStore);
// engine.execute({}, rule1).subscribe(x => {
//     console.log('completed');
// });
// engine.execute({}, rule2).subscribe(x => {
//     console.log('completed');
// });
engine.run({ root: {}, ruleName: 'test rule 3' }).subscribe((r) => {
    console.log(JSON.stringify(r));
    console.log('completed');
});
//# sourceMappingURL=index.js.map