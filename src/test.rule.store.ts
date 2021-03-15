import { JasperRule, ExecutionContext, Operator } from './rule.config'
import { of } from 'rxjs'
import _ from 'lodash'
import { tap } from 'rxjs/operators'

const store: JasperRule[] = [
    {
        name: 'test rule 1',
        description: '',
        beforeAction: (o) => {
            console.log('preprocessing rule 1')
        },
        action: async () => {
            // console.log('processing rule 1')
            // return 'processing rule 1'
            throw 'error rule 1'
        },
    },
    {
        name: 'test rule 2',
        description: '',
        beforeAction: (o) => {
            console.log('preprocessing rule 2')
        },
        action: () => {
            console.log('processing rule 2')
            return 'processing rule 2'
        },
    },
    {
        name: 'test rule 3',
        description: '',
        beforeAction: async (context: ExecutionContext) => {
            console.log('preprocessing rule 3')
        },
        action: of('processing 3').pipe(
            tap(() => console.log('processing rule 3'))
        ),
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
                // {
                //     name: '',
                //     operator: Operator.AND,
                //     rules: [
                //         {
                //             name: '',
                //             path: '$',
                //             rule: 'test rule 2',
                //         },
                //     ]
                // }
            ],
        },
    },
    {
        name: 'test rule 4',
        description: '',
        beforeAction: (o) => {
            console.log('preprocessing rule 4')
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
]

export const StaticRuleStore = _.reduce(
    store,
    (acc: any, rule) => {
        acc[rule.name] = rule
        return acc
    },
    {}
)
