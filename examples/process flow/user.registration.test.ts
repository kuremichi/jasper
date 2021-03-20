import { JasperEngine } from '../../src/engine';
import { EngineOptions } from '../../src/engine.option';
import { JasperEngineRecipe } from '../../src/enum';
import { StaticRuleStore } from './user.registrator.rule.store';

it('should run', (done) => {
    const options: EngineOptions = {
        recipe: JasperEngineRecipe.ValidationRuleEngine,
        suppressDuplicateTasks: true,
        debug: false,
    };
    const engine = new JasperEngine(StaticRuleStore, options);

    engine
        .run({
            root: { name: 'Guest' },
            ruleName: 'create an account',
        })
        .subscribe({
            next: (r) => {
                console.log(JSON.stringify(r, null, 2));
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
