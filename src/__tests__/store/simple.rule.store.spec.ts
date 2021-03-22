import { Rule } from '../../rule';
import { SimpleRuleStore } from '../../store/simple.rule.store';

it('should throw exception if rule exists already', () => {
    const rule: Rule = {
        name: 'mockRule',
        description: 'description for mock rule',
    };

    const store = new SimpleRuleStore(rule);

    expect(() => {
        store.register(rule);
    }).toThrow(/rule mockRule exists already/);
});

it('should not throw exception if rule exists already but set to override', () => {
    const rule: Rule = {
        name: 'mockRule',
        description: 'description for mock rule',
    };

    const store = new SimpleRuleStore(rule);

    expect(() => {
        store.register(rule, true);
    }).not.toThrow();
});

it('should register rules if provided as a dictionary', (done) => {
    const rule1: Rule = {
        name: 'rule1',
        description: 'description for mock rule',
    };

    const rule2: Rule = {
        name: 'rule2',
        description: 'description for mock rule',
    };

    const store = new SimpleRuleStore();

    expect(() => {
        store.registerRuleDictionary({ rule1, rule2 });
    }).not.toThrow();

    const sub1 = store.get(rule1.name).subscribe((rule) => {
        expect(rule).toBe(rule1);
    });

    const sub2 = store.get(rule2.name).subscribe((rule) => {
        expect(rule).toBe(rule2);
        done();
    });

    sub1.unsubscribe();
    sub2.unsubscribe();
});
