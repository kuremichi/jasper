import { JasperEngine } from '../../src/engine';
import { StaticRuleStore } from './user.registrator.rule.store';
import { EngineOptions } from '../../src/rule.config';
import { JasperEngineRecipe } from '../../src/recipe';

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
