import { Rule } from '../../src/rule';
import { SimpleRuleStore } from '../../src/store/simple.rule.store';

it('should throw exception if rule exists already', () => {
    const rule: Rule<any> = {
        name: 'mockRule',
        description: 'description for mock rule',
    };

    const store = new SimpleRuleStore(rule);

    expect(() => {
        store.register(rule);
    }).toThrow(/rule mockRule exists already/);
});

it('should not throw exception if rule exists already but set to override', () => {
    const rule: Rule<any> = {
        name: 'mockRule',
        description: 'description for mock rule',
    };

    const store = new SimpleRuleStore(rule);

    expect(() => {
        store.register(rule, true);
    }).not.toThrow();
});

it('should register rules if provided as array', (done) => {
    const rule1: Rule<any> = {
        name: 'rule1',
        description: 'description for mock rule',
    };

    const rule2: Rule<any> = {
        name: 'rule2',
        description: 'description for mock rule',
    };

    const store = new SimpleRuleStore();

    expect(() => {
        store.registerRuleArray([rule1, rule2]);
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

it('should register rules if provided as array and override if exists', (done) => {
    const rule1: Rule<any> = {
        name: 'rule1',
        description: 'description for mock rule',
    };

    const rule2: Rule<any> = {
        name: 'rule1',
        description: 'description for mock rule',
    };

    const store = new SimpleRuleStore();

    expect(() => {
        store.registerRuleArray([rule1, rule2], true,);
    }).not.toThrow();

    const sub1 = store.get(rule1.name).subscribe((rule) => {
        expect(rule).toBe(rule2);
    });

    const sub2 = store.get(rule2.name).subscribe((rule) => {
        expect(rule).toBe(rule2);
        done();
    });

    sub1.unsubscribe();
    sub2.unsubscribe();
});

it('should register rules if provided as a dictionary', (done) => {
    const rule1: Rule<any> = {
        name: 'rule1',
        description: 'description for mock rule',
    };

    const rule2: Rule<any> = {
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

it('should register rules if provided as a dictionary and override if exists', (done) => {
    const rule1: Rule<any> = {
        name: 'rule1',
        description: 'description for mock rule1-1',
    };

    const rule2: Rule<any> = {
        name: 'rule1',
        description: 'description for mock rule1-2',
    };

    const store = new SimpleRuleStore(rule1);

    expect(() => {
        store.registerRuleDictionary({ rule2 }, true);
    }).not.toThrow();

    const sub1 = store.get(rule1.name).subscribe((rule) => {
        expect(rule).toBe(rule2);
    });

    const sub2 = store.get(rule2.name).subscribe((rule) => {
        expect(rule).toBe(rule2);
        done();
    });

    sub1.unsubscribe();
    sub2.unsubscribe();
});
