import { Observable, of } from 'rxjs';
import _ from 'lodash';
import { tap, switchMap } from 'rxjs/operators';
import { JasperRule } from '../../src/jasper.rule';
import { ExecutionContext } from '../../src/execution.context';
import { ExecutionOrder } from '../../src/enum';



const store: JasperRule[] = [
    {
        name: 'is late payment ?',
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
            ),
        dependencies: {
            name: 'finishing user registration',
            executionOrder: ExecutionOrder.Parallel,
            rules: [
                {
                    name: 'new account rule',
                    rule: 'is late payment ?',
                    path: 'payments',
                    when: 'activeDays <= 365',
                },
                {
                    name: 'normal account rule',
                    rule: 'is late payment ?',
                    path: 'payments[[0..2]]',
                    when: 'activeDays > 365 and age > 21',
                },
                {
                    name: 'under21 account rule',
                    rule: 'is late payment ?',
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
