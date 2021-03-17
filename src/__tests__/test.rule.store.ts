import { JasperRule, Operator } from '../rule.config';
import { of } from 'rxjs';
import _ from 'lodash';
import { tap, delay } from 'rxjs/operators';

const store: JasperRule[] = [
    {
        name: 'test rule 1',
        description: '',
        beforeAction: () => {
            console.log('preprocessing rule 1');
        },
        action: of(1).pipe(
            delay(3000),
            tap(() => {
                throw new Error('an error has occurred');
            }),
        )
    },
    {
        name: 'test rule 2',
        description: '',
        beforeAction: () => {
            console.log('preprocessing rule 2');
        },
        action: () => {
            console.log('processing rule 2');
            return 'processing rule 2';
        },
    },
    {
        name: 'test rule 3',
        description: '',
        beforeAction: async () => {
            console.log('preprocessing rule 3');
        },
        action: of('processing 3').pipe(tap(() => console.log('processing rule 3'))),
        dependencies: {
            name: 'dependencies of rule 3',
            rules: [
                {
                    name: 'dependency rule 3 - 1',
                    path: '$',
                    rule: 'test rule 2',
                },
                {
                    name: 'dependency rule 3 - 2',
                    path: '$',
                    rule: 'test rule 4',
                },
                {
                    name: 'dependency rule 3 - 3',
                    operator: Operator.AND,
                    rules: [
                        {
                            name: 'dependency rule 3 - 3 - 1',
                            path: '$',
                            rule: 'test rule 2',
                        },
                        {
                            name: 'dependency rule 3 - 3 - 2',
                            path: '$',
                            rule: 'test rule 1',
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
            console.log('preprocessing rule 4');
        },
        action: '"processing rule 4"',
        dependencies: {
            name: 'dependencies of rule 4',
            operator: Operator.OR,
            rules: [
                {
                    name: 'dependency rule 4 - 1',
                    path: '$',
                    rule: 'test rule 2',
                },
                {
                    name: 'dependency rule 4 - 2',
                    path: '$',
                    rule: 'test rule 1',
                },
            ],
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
