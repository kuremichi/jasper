import { JasperEngine } from '../src/engine'
import { StaticRuleStore } from './test.sequential.store';

const engine = new JasperEngine(StaticRuleStore);

engine.run({ root: {}, ruleName: 'test rule 3' }).subscribe((r) => {
    console.log(JSON.stringify(r));
    console.log('completed')
});