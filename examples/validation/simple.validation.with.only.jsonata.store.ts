import { of } from 'rxjs';
import _ from 'lodash';
import { tap, mapTo } from 'rxjs/operators';
import { Rule } from '../../src/jasper.rule';
import { ExecutionContext } from '../../src/execution.context';
import { ExecutionOrder } from '../../src/enum';

const store: Rule[] = [
    {
        name: 'is payment on time ?',
        description: 'a payment is late if its payment date is greater than dueDate',
        action: '$toMillis(paymentDate) <= $toMillis(dueDate)',
    },
    {
        name: 'check if account is in good standing',
        description: 'the workflow to get an account created',
        metadata: {
            entity: 'account',
        },
        action: (context: ExecutionContext) =>
            of({
                id: 1,
                name: context.root.name,
            }).pipe(
                tap((user: { id: number, name: string }) => {
                    console.log(`checking an account standing for user ${user.name}.`);
                }),
                mapTo(true),
            ),
        dependencies: {
            name: 'finishing user registration',
            executionOrder: ExecutionOrder.Parallel,
            rules: [
                {
                    name: 'new account rule',
                    rule: 'is payment on time ?',
                    path: 'payments',
                    when: 'activeDays <= 365',
                },
                {
                    name: 'normal account rule',
                    rule: 'is payment on time ?',
                    path: 'payments[[0..2]]',
                    when: 'activeDays > 365 and age > 21',
                },
                {
                    name: 'under21 account rule',
                    rule: 'is payment on time ?',
                    path: 'payments[[0..1]]',
                    when: 'activeDays > 365 and age <= 21',
                }
            ]
        },
    },
];

export const StaticRuleStore = _.reduce(
    store,
    (acc: any, rule) => {
        acc[rule.name] = rule;
        return acc;
    },
    {}
);
