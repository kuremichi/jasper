import { JasperEngine } from './engine'
import { StaticRuleStore } from './test.rule.store';

const engine = new JasperEngine(StaticRuleStore);
// engine.execute({}, rule1).subscribe(x => {
//     console.log('completed');
// });
// engine.execute({}, rule2).subscribe(x => {
//     console.log('completed');
// });

engine.run({ root: {}, ruleName: 'test rule 3' }).subscribe((r) => {
    console.log(JSON.stringify(r));
    console.log('completed')
})
