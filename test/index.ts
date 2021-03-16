import { JasperEngine } from '../src/engine'
import { StaticRuleStore } from './test.sequential.store';

const engine = new JasperEngine(StaticRuleStore);

engine.run({ root: { packages: [{id: 1}, {id: 2}]}, ruleName: 'test rule 3' }).subscribe((r) => {
    console.log(JSON.stringify(r));
    console.log('completed')
});