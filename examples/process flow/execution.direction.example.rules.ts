import { of, timer } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { Rule } from '../../src/rule';
import { Direction, ExecutionOrder } from '../../src/enum';
import { SimpleRuleStore } from '../../src/store/simple.rule.store';

const rules: Rule<any>[] = [
    {
        name: 'rule 1',
        description: 'rule 1',
        beforeAction: (context) => {
            console.log(`[${context.contextId}]: preprocessing rule 1`);
            return of(null);
        },
        action: (context) => {
            return timer(Math.random() * 1000, 1000).pipe(
                tap(() => {
                    console.log(`[${context.contextId}]: processing rule 1`);
                }),
                take(1),
            );
        },
        direction: Direction.InsideOut,
        dependencies: {
            name: 'dependency of rule 1',
            rules: [
                {
                    name: 'rule 2',
                    path: '$',
                    rule: 'rule 2',
                }
            ]
        }
    },
    {
        name: 'rule 2',
        description: '',
        beforeAction: (context) => {
            console.log(`[${context.contextId}]: preprocessing rule 2`);
            return of(null)
        },
        action: (context) => {
            return timer(3000, 1000).pipe(
                tap(() => {
                    console.log(`[${context.contextId}]: processing rule 2`);
                }),
                take(1),
            );
        },
        afterAction: (context) => {
            console.log(`[${context.contextId}]: postprocessing rule 2`);
            return of(null);
        },
    },
    {
        name: 'rule 3',
        description: '',
        beforeAction: (context) => {
            console.log(`[${context.contextId}]: preprocessing rule 3`);
            return of(null)
        },
        action: (context) => 
            of('processing 3').pipe(
                tap(() => console.log(`[${context.contextId}]: processing rule 3`))
            ),
        direction: Direction.InsideOut,
        dependencies: {
            name: 'dependencies of rule 3',
            beforeDependency: (context) => {
                console.log(`[${context.contextId}]: before dependences of rule 3`);
                return of(null);
            },
            afterDependency: (context) => {
                console.log(`[${context.contextId}]: after dependences of rule 3`);
                return of(null);
            },
            rules: [
                {
                    name: 'dependency rule 3 - 1',
                    rule: 'rule 1',
                    executionOrder: ExecutionOrder.Sequential,
                    path: '$',
                    beforeDependency: (context) => {
                        console.log(`[${context.contextId}]: before dependency rule 3 - 1`);
                        return of(null);
                    },
                    beforeEach: (_pathObject, index, context) => {
                        console.log(`[${context.contextId}][${index}]: before path object`);
                        return of(null);
                    },
                    afterEach: (_pathObject, index, context) => {
                        console.log(`[${context.contextId}][${index}]: after path object`);
                        return of(null);
                    },
                    afterDependency: (context) => {
                        console.log(`[${context.contextId}]: after dependency rule 3 - 1`);
                        return of(null);
                    },
                },
            ],
        },
        afterAction: (context) => {
            console.log(`[${context.contextId}]: postprocessing rule 3`);
            return of(null);
        },
    },
];

export const ruleStore = new SimpleRuleStore(...rules);