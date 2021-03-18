import { JasperEngine } from '../engine';
import { StaticRuleStore } from './test.sequential.store';
import { EngineOptions } from '../rule.config';
import { JasperEngineRecipe } from '../recipe';
jest.setTimeout(150000);
describe('dummy', () => {
    it('should run', (done) => {
        const options: EngineOptions = {
            recipe: JasperEngineRecipe.ValidationRuleEngine,
            suppressDuplicateTasks: true,
            debug: true,
            maxConcurrency: 1,
        }
        const engine = new JasperEngine(StaticRuleStore, options);

        engine.run({ root: { packages: [{ id: 1 }, { id: 1 }] }, ruleName: 'test rule 3' }).subscribe({
            next: (r) => {
                console.log(JSON.stringify(r));
                console.log('completed');
            },
            error: (err) => {
                console.error(err);
            },
            complete: () => {
                expect(true).toBe(true);
                done();
            }
        });
    });
});
