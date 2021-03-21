import { JasperEngine } from '../../src/engine';
import { EngineOptions } from '../../src/engine.option';
import { EngineRecipe } from '../../src/enum';
import { StaticRuleStore } from './user.registrator.rule.store';
jest.setTimeout(15000);
it('should run', (done) => {
    const options: EngineOptions = {
        recipe: EngineRecipe.ValidationRuleEngine,
        suppressDuplicateTasks: true,
        debug: true,
    };
    const engine = new JasperEngine(StaticRuleStore, options);

    engine
        .run({
            root: { name: 'Guest' },
            ruleName: 'create an account',
        })
        .subscribe({
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
            },
        });
});
