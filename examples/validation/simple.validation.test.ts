import { JasperEngine } from '../../src/engine';
import { ExecutionOrder, EngineRecipe, Operator } from '../../src/enum';
import { Rule } from '../../src/rule';
import { SimpleRuleStore } from '../../src/store/simple.rule.store';

const isJasper: Rule = {
    name: 'isJasper',
    description: 'a rule to check if the dog is named Jasper',
    action: 'name = "Jasper"',
};

const isSamoyed: Rule = {
    name: 'isSamoyed',
    description: 'a rule to check if the dog is of breed samoyed',
    action: 'breed = "Samoyed"',
};

const isMyDog: Rule = {
    name: 'isMyDog',
    description: 'a rule to check if the dog is my dog',
    dependencies: {
        name: 'my dog is a samoyed named Jasper',
        operator: Operator.AND,
        executionOrder: ExecutionOrder.Parallel,
        rules: [
            {
                name: 'name should be jasper',
                path: '$',
                rule: isJasper.name,
            },
            {
                name: 'breed should be samoyed',
                path: '$',
                rule: isSamoyed.name,
            },
        ],
    },
};

const ruleStore = new SimpleRuleStore(isJasper, isSamoyed, isMyDog);

it('should run', (done) => {
    const engine = new JasperEngine({
        ruleStore,
        options: {
            recipe: EngineRecipe.ValidationRuleEngine,
        }
    });

    const dog = {
        name: 'Jasper',
        breed: 'Samoyed',
    };

    engine
        .run({
            root: dog,
            ruleName: 'isMyDog',
        })
        .subscribe({
            next: (response) => {
                expect(response.isSuccessful).toBe(true);
                done();
            },
        });
});
