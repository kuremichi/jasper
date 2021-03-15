import { JasperEngine } from './engine'

const engine = new JasperEngine()
// engine.execute({}, rule1).subscribe(x => {
//     console.log('completed');
// });
// engine.execute({}, rule2).subscribe(x => {
//     console.log('completed');
// });
engine.execute({ root: {}, ruleName: 'test rule 3' }).subscribe((r) => {
    console.log(JSON.stringify(r));
    console.log('completed')
})
