import { JasperRule, Operator, ExecutionOrder } from '../rule.config';
import { of } from 'rxjs';
import _ from 'lodash';
import { tap, delay } from 'rxjs/operators';

const store: JasperRule[] = [
    {
        name: 'test rule 1',
        description: '',
        metadata: {
            entity: 'account'
        },
        beforeAction: () => {
            return of(1).pipe(
                tap(() => {
                    
                    console.log('preprocessing rule 1');
                })
            );
        },
        action: () => of('result for rule 1').pipe(
            tap(() => {
                console.log('processing rule 1');
            }),
            delay(1000),
        ),
        afterAction: (response, context) => {
            return of(response).pipe(
                tap(() => {
                    console.log(`postprocessing rule 1 for context ${context.contextId}`);
                }),
            );
        },
    },
    {
        name: 'test rule 2',
        description: '',
        beforeAction: () => {
            return of(1).pipe(
                tap(() => {
                    console.log('preprocessing rule 2');
                })
            );
        },
        action: () => of('result for rule 2').pipe(
            tap(() => {
                console.log('processing rule 2');
            }),
            delay(1000),
        ),
    },
    {
        name: 'test rule 3',
        description: '',
        beforeAction: () => {
            return of(1).pipe(
                tap(() => {
                    console.log('preprocessing rule 3');
                })
            );
        },
        action: () => of('processing 3').pipe(
            tap(() => console.log('processing rule 3')),
            delay(1300),
        ),
        dependencies: {
            name: 'dependencies of rule 3',
            rules: [
                {
                    name: 'dependency rule 3 - 1',
                    path: '$',
                    rule: 'test rule 1',
                },
                {
                    name: 'dependency rule 3 - 2',
                    executionOrder: ExecutionOrder.Sequential,
                    operator: Operator.AND,
                    rules: [
                        {
                            name: 'dependency rule 3 - 2 - 1',
                            path: 'packages',
                            rule: 'test rule 2',
                            when: '$count(packages) > 2',
                            whenDescription: 'when there are more than 2 packages'
                        },
                        {
                            name: 'dependency rule 3 - 2 - 2',
                            path: 'packages',
                            rule: 'test rule 2',
                        },
                        {
                            name: 'dependency rule 3 - 2 - 3',
                            path: '$',
                            rule: 'test rule 4',
                        },
                    ],
                },
            ],
        },
    },
    {
        name: 'test rule 4',
        description: '',
        beforeAction: () => {
            return of(1).pipe(
                tap(() => {
                    console.log('preprocessing rule 4');
                })
            );
        },
        action: () => of('processing 4').pipe(
            tap(() => console.log('processing rule 4')),
            delay(1500),
        ),
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
