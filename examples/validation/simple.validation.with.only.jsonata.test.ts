import moment from 'moment';
import { JasperEngine } from '../../src/engine';
import { EngineOptions } from '../../src/engine.option';
import { EngineRecipe } from '../../src/enum';
import { SimpleRuleStore } from '../../src/store/simple.rule.store';
import { rules } from './simple.validation.with.only.jsonata.store';

/**
 * Rule to consider if a customer account is in good standing
 *  For account opened for less than 12 months
 *      * the account is in good standing if there is no late payments
 *  For account opened for more than 12 months
 *      if the customer is 21 years old or under, the account is in good standing if there is no late payments in the last 2 months
 *      if the customer is above 21 years old, the account is in good stadning if there is no late payments in the last 3 months
 */

it('should run', (done) => {
    const options: EngineOptions = {
        recipe: EngineRecipe.ValidationRuleEngine,
        suppressDuplicateTasks: true,
        debug: true,
    };

    const ruleStore = new SimpleRuleStore(...rules);
    const engine = new JasperEngine({ruleStore, options});

    const now = moment.utc();

    // in good standing
    const newCustomer = {
        name: 'Guest1',
        age: 21,
        activeDays: 100,
        payments: [
            {
                billingCycle: moment.utc().add(-1, 'month').toJSON(),
                dueDate: moment.utc().add(-1, 'month').toJSON(),
                paymentDate: moment.utc().add(-1, 'month').toJSON(),
            },
            {
                billingCycle: moment.utc().add(-2, 'month').toJSON(),
                dueDate: moment.utc().add(-2, 'month').toJSON(),
                paymentDate: moment.utc().add(-2, 'month').toJSON(),
            },
            {
                billingCycle: moment.utc().add(-3, 'month').toJSON(),
                dueDate: moment.utc().add(-3, 'month').toJSON(),
                paymentDate: moment.utc().add(-3, 'month').toJSON(),
            },
        ],
    };

    // not in good standing
    const normalCustomer = {
        name: 'Guest2',
        age: 25,
        activeDays: 380,
        payments: [
            {
                billingCycle: moment.utc().add(-1, 'month').toJSON(),
                dueDate: moment.utc().add(-1, 'month').toJSON(),
                paymentDate: moment.utc().add(-1, 'month').toJSON(),
            },
            {
                billingCycle: moment.utc().add(-2, 'month').toJSON(),
                dueDate: moment.utc().add(-2, 'month').toJSON(),
                paymentDate: moment.utc().add(-2, 'month').toJSON(),
            },
            {
                billingCycle: moment.utc().add(-3, 'month').toJSON(),
                dueDate: moment.utc().add(-3, 'month').toJSON(),
                paymentDate: moment.utc().add(-3, 'month').add(1, 'day').toJSON(), // late payment
            },
        ],
    };

    // in good standing
    const studentCustomer = {
        name: 'Guest3',
        age: 21,
        activeDays: 400,
        payments: [
            {
                billingCycle: now.add(-1, 'month').toJSON(),
                dueDate: now.add(-1, 'month').toJSON(),
                paymentDate: now.add(-1, 'month').toJSON(),
            },
            {
                billingCycle: now.add(-2, 'month').toJSON(),
                dueDate: now.add(-2, 'month').toJSON(),
                paymentDate: now.add(-2, 'month').toJSON(),
            },
            {
                billingCycle: now.add(-3, 'month').toJSON(),
                dueDate: now.add(-3, 'month').toJSON(),
                paymentDate: now.add(-3, 'month').add(1, 'day').toJSON(), // late payment
            },
        ],
    };

    engine
        .run({
            root: newCustomer,
            ruleName: 'check if account is in good standing',
        })
        .subscribe({
            next: (r) => {
                expect(r.isSuccessful).toBe(true);
            },
        });

    engine
        .run({
            root: normalCustomer,
            ruleName: 'check if account is in good standing',
        })
        .subscribe({
            next: (r) => {
                expect(r.isSuccessful).toBe(false);
            },
        });

    engine
        .run({
            root: studentCustomer,
            ruleName: 'check if account is in good standing',
        })
        .subscribe({
            next: (r) => {
                expect(r.isSuccessful).toBe(true);
                done();
            },
        });
});
