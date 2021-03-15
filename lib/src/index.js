"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_1 = require("./engine");
const engine = new engine_1.JasperEngine();
// engine.execute({}, rule1).subscribe(x => {
//     console.log('completed');
// });
// engine.execute({}, rule2).subscribe(x => {
//     console.log('completed');
// });
engine.execute({ root: {}, ruleName: 'test rule 3' }).subscribe((r) => {
    console.log(JSON.stringify(r));
    console.log('completed');
});
//# sourceMappingURL=index.js.map