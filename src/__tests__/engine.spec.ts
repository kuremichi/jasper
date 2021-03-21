import { JasperEngine } from '../engine';

import { Observable, of, empty, forkJoin, concat, throwError } from 'rxjs';
import _ from 'lodash';
import { switchMap, tap, toArray } from 'rxjs/operators';

import { JasperRule } from '../jasper.rule';
import { ExecutionContext } from '../execution.context';
import { ExecutionOrder, JasperEngineRecipe, Operator } from '../enum';
import { SimpleDependency } from '../dependency/simple.dependency';
import { SimpleDependencyExecutionResponse } from '../dependency/simple.dependency.execution.response';
import { CompositeDependency } from '../dependency/composite.dependency';
import { CompositeDependencyResponse } from '../dependency/composite.dependency.response';
import { ExecutionResponse } from '../execution.response';
import { SimpleDependencyResponse } from '../dependency/simple.dependency.response';


describe('processExpression', () => {
    const mockRule: JasperRule = {
        name: 'mockRule',
        description: 'description for mock rule',
        action: () => of(1),
    };
    const response = {
        rule: mockRule.name,
        hasError: false,
        isSuccessful: false,
        result: undefined,
    };

    it('should handle jsonata path expression', (done) => {
        const engine = new JasperEngine({});
        const processExpressionSpy = jest.spyOn(engine as any, 'processExpression');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const ob: Observable<any[]> = (engine as any).processExpression('children', context);

        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(2);
            },
            complete: () => {
                expect(processExpressionSpy).toBeCalledTimes(1);
                done();
            },
        });
    });

    it('should handle observable path expression', (done) => {
        const engine = new JasperEngine({});
        const processExpressionSpy = jest.spyOn(engine as any, 'processExpression');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
            response,
        };

        const ob: Observable<any[]> = (engine as any).processExpression(
            () => of(true).pipe(
                switchMap(() => {
                    return of(_.get(context.root, 'children'));
                })
            ),
            context
        );

        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(2);
            },
            complete: () => {
                expect(processExpressionSpy).toBeCalledTimes(1);
                done();
            },
        });
    });

    it('should return [] otherwise', (done) => {
        const engine = new JasperEngine({});
        const processExpressionSpy = jest.spyOn(engine as any, 'processExpression');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
            response,
        };

        const ob: Observable<any[]> = (engine as any).processExpression(null, context);

        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(0);
            },
            complete: () => {
                expect(processExpressionSpy).toBeCalledTimes(1);
                done();
            },
        });
    });
});

describe('executeAction', () => {
    const mockRule: JasperRule = {
        name: 'mockRule',
        description: 'description for mock rule',
        action: () => of(1),
    };
    const response = {
        rule: mockRule.name,
        hasError: false,
        isSuccessful: false,
        result: undefined,
    };

    it('should handle jsonata action expression', (done) => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
            response,
        };

        const action = 'children[id=1]';

        const ob: Observable<any> = (engine as any).executeAction({ action, context });

        ob.subscribe({
            next: (result: any) => {
                expect(result).toMatchObject(context.root.children[0]);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                done();
            },
        });
    });

    it('should handle String jsonata action expression', (done) => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
            response,
        };

        const action = new String('children[id=1]');

        const ob: Observable<any> = (engine as any).executeAction({ action, context });

        ob.subscribe({
            next: (result: any) => {
                expect(result).toMatchObject(context.root.children[0]);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                done();
            },
        });
    });

    it('should handle observable action expression', (done) => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
            response,
        };

        const action = of(123);

        const ob: Observable<any> = (engine as any).executeAction({ action, context });

        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(123);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                done();
            },
        });
    });

    it('should return null if invalid expression passed', (done) => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');

        const action = 1;
        const ob: Observable<any> = (engine as any).executeAction({ action, context: {} });

        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(null);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                done();
            },
        });
    });
});

describe('processSimpleDependency', () => {
    const mockRule: JasperRule = {
        name: 'mockRule',
        description: 'description for mock rule',
        action: () => of(1),
    };

    const ruleStore: Record<string, JasperRule> = {};
    ruleStore[`${mockRule.name}`] = mockRule;

    const response = {
        rule: mockRule.name,
        hasError: false,
        isSuccessful: false,
        result: undefined,
    };

    it('should skip simple dependency if jsonata when expression evaluates to false', done => {
        const engine = new JasperEngine(ruleStore);
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            when: 'children ~> $count() > 2',
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(simpleDependency, context);

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(true);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            }
        })

        subscription.unsubscribe();
    });

    it('should skip simple dependency if observable when expression evaluates to false', done => {
        const engine = new JasperEngine(ruleStore);
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            when: () => of(false),
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(simpleDependency, context);

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(true);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            }
        })

        subscription.unsubscribe();
    });

    it('should return response with error if unable to evaluate path expression', (done) => {
        const engine = new JasperEngine(ruleStore);
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            when: () => throwError(new Error('error evaluating when')),
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(simpleDependency, context);

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(false);
                expect(dependencyResponse.hasError).toBe(true);
                done();
            }
        })

        subscription.unsubscribe();
    });

    it('should return response without error if unable to evaluate path expression but handled by onDependencyError hook', (done) => {
        const engine = new JasperEngine(ruleStore);
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            when: () => throwError(new Error('error evaluating when')),
            onDependencyError: (_err, response) => {
                response.hasError = false;
                response.isSuccessful = true;
                return of(response);
            }
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(simpleDependency, context);

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(true);
                expect(dependencyResponse.hasError).toBe(false);
                done();
            }
        })

        subscription.unsubscribe();
    });

    it('should run beforeDependency hook if provided', done => {
        const engine = new JasperEngine(ruleStore);
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const mockFn = jest.fn().mockReturnValue(1);
        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            beforeDependency: () => {
                return of(mockFn());
            }
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(simpleDependency, context);

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            }
        })

        subscription.unsubscribe();
    });

    it('should not execute dependency rule if no object found by path expression', done => {
        const mockFn = jest.fn().mockReturnValue(1);
        const mockRule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                mockFn();
                return of(1);
            },
        };
    
        const ruleStore: Record<string, JasperRule> = {};
        ruleStore[`${mockRule.name}`] = mockRule;
        const engine = new JasperEngine(ruleStore);
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        ruleStore[`${mockRule.name}`] = mockRule;
        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'notfound',
            rule: mockRule.name,
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(simpleDependency, context);

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(0);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            }
        })

        subscription.unsubscribe();
    });

    it('should run simpleDependency hooks', done => {
        const mockFn = jest.fn().mockReturnValue(1);
        const mockRule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                mockFn();
                return of(1);
            },
        };
    
        const ruleStore: Record<string, JasperRule> = {};
        ruleStore[`${mockRule.name}`] = mockRule;
        const engine = new JasperEngine(ruleStore);
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        ruleStore[`${mockRule.name}`] = mockRule;

        const beforeEachFn = jest.fn().mockReturnValue(1);
        const afterEachFn = jest.fn().mockReturnValue(1);
        const beforeDependencyFn = jest.fn().mockReturnValue(1);
        const afterDependencyFn = jest.fn().mockReturnValue(1);

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            beforeDependency: () => {
                return of(beforeDependencyFn());
            },
            beforeEach: () => {
                return of(beforeEachFn());
            },
            afterEach: () => {
                return of(afterEachFn());
            },
            afterDependency: () => {
                return of(afterDependencyFn());
            }
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(simpleDependency, context);

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(2);
                expect(beforeDependencyFn).toBeCalledTimes(1);
                expect(beforeEachFn).toBeCalledTimes(2);
                expect(afterEachFn).toBeCalledTimes(2);
                expect(afterDependencyFn).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(true);
                expect(dependencyResponse.matches).toHaveLength(2);
                done();
            }
        })

        subscription.unsubscribe();
    });

    it('should return response with error if failed to run dependency rule for any path object', (done) => {
        const mockFn = jest.fn().mockReturnValueOnce(1)
            .mockImplementationOnce(() => {
                throw new Error('error'); 
            });

        const mockRule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                mockFn();
                return of(1);
            },
        };
    
        const myRuleStore: Record<string, JasperRule> = {};
        myRuleStore[`${mockRule.name}`] = mockRule;
        const engine = new JasperEngine(myRuleStore);

        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(simpleDependency, context);

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(false);
                expect(dependencyResponse.hasError).toBe(true);
                expect(dependencyResponse.errors).toHaveLength(1);
                done();
            }
        })

        subscription.unsubscribe();
    });

    it('should return response without error if failed to run dependency rule for any path object but handled by onEachError Hook', (done) => {
        const mockFn = jest.fn().mockReturnValueOnce(1)
            .mockImplementationOnce(() => {
                throw new Error('error'); 
            });

        const mockRule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                mockFn();
                return of(1);
            },
        };
    
        const myRuleStore: Record<string, JasperRule> = {};
        myRuleStore[`${mockRule.name}`] = mockRule;
        const engine = new JasperEngine(myRuleStore);

        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            onEachError: (_err, response,) => {
                response.isSuccessful = true;
                response.hasError = false;
                return of(response);
            }
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: mockRule,
            _process$: of(),
            contextData: {},
            complete: false,
            response,
        };

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(simpleDependency, context);

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(true);
                expect(dependencyResponse.hasError).toBe(false);
                expect(dependencyResponse.errors).toHaveLength(0);
                done();
            }
        })

        subscription.unsubscribe();
    });
});


// describe('collectDependencyTasks', () => {
//     describe('extractSimpleDependencyTasks', () => {
//         it('should return response with error if unable to evaluate when expression', (done) => {
//             const rule: JasperRule = {
//                 name: 'mockRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };
//             const engine = new JasperEngine({
//                 mockRule: rule,
//             });

//             const extractSimpleDependencyTasksSpy = jest.spyOn(engine as any, 'extractSimpleDependencyTasks');

//             const simpleDependency: SimpleDependency = {
//                 name: 'simple dependency',
//                 rule: rule.name,
//                 path: '$',
//                 when: () => {
//                     throw new Error('path error');
//                 },
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<SimpleDependencyExecutionResponse>> = {};
//             (engine as any).extractSimpleDependencyTasks(accumulator, simpleDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: SimpleDependencyExecutionResponse[]) => {
//                         expect(extractSimpleDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(results[0].hasError).toBe(true);
//                         expect(results[0].isSuccessful).toBe(false);
//                         done();
//                     },
//                 });
//         });

//         it('should run simple dependency if when expression is not defined', (done) => {
//             const rule: JasperRule = {
//                 name: 'mockRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };
//             const engine = new JasperEngine({
//                 mockRule: rule,
//             });

//             const extractSimpleDependencyTasksSpy = jest.spyOn(engine as any, 'extractSimpleDependencyTasks');
//             const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

//             const simpleDependency: SimpleDependency = {
//                 name: 'simple dependency',
//                 rule: rule.name,
//                 path: '$',
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<SimpleDependencyExecutionResponse>> = {};
//             (engine as any).extractSimpleDependencyTasks(accumulator, simpleDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: SimpleDependencyExecutionResponse[]) => {
//                         expect(extractSimpleDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(processSimpleDependencySpy).toBeCalledTimes(1);
//                         expect(results[0].hasError).toBe(false);
//                         expect(results[0].isSuccessful).toBe(true);
//                         expect(results[0].result).toBe(1);
//                         done();
//                     },
//                 });
//         });

//         it('should skip simple dependency if when expression evaluates to false', (done) => {
//             const rule: JasperRule = {
//                 name: 'mockRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };
//             const engine = new JasperEngine({
//                 mockRule: rule,
//             });

//             const extractSimpleDependencyTasksSpy = jest.spyOn(engine as any, 'extractSimpleDependencyTasks');
//             const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

//             const simpleDependency: SimpleDependency = {
//                 name: 'simple dependency',
//                 rule: rule.name,
//                 path: '$',
//                 when: 'false',
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<SimpleDependencyExecutionResponse>> = {};
//             (engine as any).extractSimpleDependencyTasks(accumulator, simpleDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: SimpleDependencyExecutionResponse[]) => {
//                         expect(extractSimpleDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(processSimpleDependencySpy).toBeCalledTimes(0);
//                         expect(results[0].hasError).toBe(false);
//                         expect(results[0].isSuccessful).toBe(true);
//                         expect(results[0].isSkipped).toBe(true);
//                         expect(results[0].result).toBe(null);
//                         done();
//                     },
//                 });
//         });
//     });

//     describe('extractCompositeDependencyTasks', () => {
//         it('should return response with error if unable to evaluate when expression', (done) => {
//             const engine = new JasperEngine({});
//             const extractCompositeDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompositeDependencyTasks');
//             const rule: JasperRule = {
//                 name: 'mockRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const compositeDependency: CompositeDependency = {
//                 name: 'test composite dependency',
//                 rules: [
//                     {
//                         name: 'composite dependency',
//                         rule: rule.name,
//                         path: '$',
//                     },
//                 ],
//                 when: () => {
//                     throw new Error('path error');
//                 },
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<CompositeDependencyResponse>> = {};
//             (engine as any).extractCompositeDependencyTasks(accumulator, compositeDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: CompositeDependencyResponse[]) => {
//                         expect(extractCompositeDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(results[0].hasError).toBe(true);
//                         expect(results[0].isSuccessful).toBe(false);
//                         done();
//                     },
//                 });
//         });

//         it('should skip composite dependency if when express evalutes to false', (done) => {
//             const rule: JasperRule = {
//                 name: 'mockRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const engine = new JasperEngine({
//                 mockRule: rule,
//             });

//             const extractCompositeDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompositeDependencyTasks');

//             const compositeDependency: CompositeDependency = {
//                 name: 'test composite dependency',
//                 rules: [
//                     {
//                         name: 'composite dependency',
//                         rule: rule.name,
//                         path: '$',
//                     },
//                 ],
//                 when: () => of(false),
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<CompositeDependencyResponse>> = {};
//             (engine as any).extractCompositeDependencyTasks(accumulator, compositeDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: CompositeDependencyResponse[]) => {
//                         expect(extractCompositeDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(results[0].hasError).toBe(false);
//                         expect(results[0].isSkipped).toBe(true);
//                         expect(results[0].isSuccessful).toBe(true);
//                         done();
//                     },
//                 });
//         });

//         it('should extract composite dependency tasks if when is not defined', (done) => {
//             const parentRule: JasperRule = {
//                 name: 'parentRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const mockRule1: JasperRule = {
//                 name: 'mockRule1',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const mockRule2: JasperRule = {
//                 name: 'mockRule2',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const engine = new JasperEngine({
//                 parentRule,
//                 mockRule1,
//                 mockRule2,
//             });

//             const extractCompositeDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompositeDependencyTasks');

//             const compositeDependency: CompositeDependency = {
//                 name: 'test composite dependency',
//                 rules: [
//                     {
//                         name: 'child dependency 1',
//                         rule: mockRule1.name,
//                         path: '$',
//                     },
//                     {
//                         name: 'child dependency 2',
//                         rule: mockRule2.name,
//                         path: '$',
//                     },
//                 ],
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule: parentRule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<CompositeDependencyResponse>> = {};
//             (engine as any).extractCompositeDependencyTasks(accumulator, compositeDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: CompositeDependencyResponse[]) => {
//                         expect(extractCompositeDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(results[0].hasError).toBe(false);
//                         expect(results[0].isSkipped).toBe(false);
//                         expect(results[0].isSuccessful).toBe(true);
//                         expect(results[0].rules[0].hasError).toBe(false);
//                         expect(results[0].rules[0].isSkipped).toBe(false);
//                         expect(results[0].rules[0].isSuccessful).toBe(true);
//                         expect(results[0].rules[1].hasError).toBe(false);
//                         expect(results[0].rules[1].isSkipped).toBe(false);
//                         expect(results[0].rules[1].isSuccessful).toBe(true);
//                         done();
//                     },
//                 });
//         });
//     });
// });

// describe('processCompositeDependency', () => {
//     describe('operator OR', () => {
//         it('consider compound compendency to be successful if either dependency task is successful', (done) => {
//             const parentRule: JasperRule = {
//                 name: 'parentRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const mockRule1: JasperRule = {
//                 name: 'mockRule1',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const mockRule2: JasperRule = {
//                 name: 'mockRule2',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return throwError(new Error('error'));
//                 },
//             };

//             const engine = new JasperEngine({
//                 parentRule,
//                 mockRule1,
//                 mockRule2,
//             });

//             const extractCompositeDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompositeDependencyTasks');

//             const compositeDependency: CompositeDependency = {
//                 name: 'test composite dependency',
//                 operator: Operator.OR,
//                 executionOrder: ExecutionOrder.Sequential,
//                 rules: [
//                     {
//                         name: 'child dependency 1',
//                         rule: mockRule1.name,
//                         path: '$',
//                     },
//                     {
//                         name: 'child dependency 2',
//                         rule: mockRule2.name,
//                         path: '$',
//                     },
//                 ],
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule: parentRule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<CompositeDependencyResponse>> = {};
//             (engine as any).extractCompositeDependencyTasks(accumulator, compositeDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: CompositeDependencyResponse[]) => {
//                         expect(extractCompositeDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(results[0].hasError).toBe(false);
//                         expect(results[0].isSkipped).toBe(false);
//                         expect(results[0].isSuccessful).toBe(true);
//                         expect(results[0].rules[0].hasError).toBe(false);
//                         expect(results[0].rules[0].isSkipped).toBe(false);
//                         expect(results[0].rules[0].isSuccessful).toBe(true);
//                         expect(results[0].rules[1].hasError).toBe(true);
//                         expect(results[0].rules[1].isSkipped).toBe(false);
//                         expect(results[0].rules[1].isSuccessful).toBe(false);
//                         done();
//                     },
//                 });
//         });

//         it('consider compound compendency to be unsuccessful if all dependency task are unsuccessful', (done) => {
//             const parentRule: JasperRule = {
//                 name: 'parentRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const mockRule1: JasperRule = {
//                 name: 'mockRule1',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return throwError(new Error('error'));
//                 },
//             };

//             const mockRule2: JasperRule = {
//                 name: 'mockRule2',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return throwError(new Error('error'));
//                 },
//             };

//             const engine = new JasperEngine({
//                 parentRule,
//                 mockRule1,
//                 mockRule2,
//             });

//             const extractCompositeDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompositeDependencyTasks');

//             const compositeDependency: CompositeDependency = {
//                 name: 'test composite dependency',
//                 operator: Operator.OR,
//                 executionOrder: ExecutionOrder.Sequential,
//                 rules: [
//                     {
//                         name: 'child dependency 1',
//                         rule: mockRule1.name,
//                         path: '$',
//                     },
//                     {
//                         name: 'child dependency 2',
//                         rule: mockRule2.name,
//                         path: '$',
//                     },
//                 ],
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule: parentRule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<CompositeDependencyResponse>> = {};
//             (engine as any).extractCompositeDependencyTasks(accumulator, compositeDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: CompositeDependencyResponse[]) => {
//                         expect(extractCompositeDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(results[0].hasError).toBe(true);
//                         expect(results[0].isSkipped).toBe(false);
//                         expect(results[0].isSuccessful).toBe(false);
//                         expect(results[0].rules[0].hasError).toBe(true);
//                         expect(results[0].rules[0].isSkipped).toBe(false);
//                         expect(results[0].rules[0].isSuccessful).toBe(false);
//                         expect(results[0].rules[1].hasError).toBe(true);
//                         expect(results[0].rules[1].isSkipped).toBe(false);
//                         expect(results[0].rules[1].isSuccessful).toBe(false);
//                         done();
//                     },
//                 });
//         });
//     });

//     describe('operator AND', () => {
//         it('consider compound compendency to be successful if all dependency tasks are successful', (done) => {
//             const parentRule: JasperRule = {
//                 name: 'parentRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const mockRule1: JasperRule = {
//                 name: 'mockRule1',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const mockRule2: JasperRule = {
//                 name: 'mockRule2',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const engine = new JasperEngine({
//                 parentRule,
//                 mockRule1,
//                 mockRule2,
//             });

//             const extractCompositeDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompositeDependencyTasks');

//             const compositeDependency: CompositeDependency = {
//                 name: 'test composite dependency',
//                 operator: Operator.AND,
//                 executionOrder: ExecutionOrder.Sequential,
//                 rules: [
//                     {
//                         name: 'child dependency 1',
//                         rule: mockRule1.name,
//                         path: '$',
//                     },
//                     {
//                         name: 'child dependency 2',
//                         rule: mockRule2.name,
//                         path: '$',
//                     },
//                 ],
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule: parentRule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<CompositeDependencyResponse>> = {};
//             (engine as any).extractCompositeDependencyTasks(accumulator, compositeDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: CompositeDependencyResponse[]) => {
//                         expect(extractCompositeDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(results[0].hasError).toBe(false);
//                         expect(results[0].isSkipped).toBe(false);
//                         expect(results[0].isSuccessful).toBe(true);
//                         expect(results[0].rules[0].hasError).toBe(false);
//                         expect(results[0].rules[0].isSkipped).toBe(false);
//                         expect(results[0].rules[0].isSuccessful).toBe(true);
//                         expect(results[0].rules[1].hasError).toBe(false);
//                         expect(results[0].rules[1].isSkipped).toBe(false);
//                         expect(results[0].rules[1].isSuccessful).toBe(true);
//                         done();
//                     },
//                 });
//         });

//         it('consider compound compendency to be unsuccessful if either dependency task is unsuccessful', (done) => {
//             const parentRule: JasperRule = {
//                 name: 'parentRule',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const mockRule1: JasperRule = {
//                 name: 'mockRule1',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return of(1);
//                 },
//             };

//             const mockRule2: JasperRule = {
//                 name: 'mockRule2',
//                 description: 'description for mock rule',
//                 action: () => {
//                     return throwError(new Error('error'));
//                 },
//             };

//             const engine = new JasperEngine({
//                 parentRule,
//                 mockRule1,
//                 mockRule2,
//             });

//             const extractCompositeDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompositeDependencyTasks');

//             const compositeDependency: CompositeDependency = {
//                 name: 'test composite dependency',
//                 operator: Operator.AND,
//                 executionOrder: ExecutionOrder.Sequential,
//                 rules: [
//                     {
//                         name: 'child dependency 1',
//                         rule: mockRule1.name,
//                         path: '$',
//                     },
//                     {
//                         name: 'child dependency 2',
//                         rule: mockRule2.name,
//                         path: '$',
//                     },
//                 ],
//             };

//             const context: ExecutionContext = {
//                 contextId: '1',
//                 root: {
//                     children: [
//                         { id: 1, text: 'child1' },
//                         { id: 2, text: 'child2' },
//                     ],
//                 },
//                 rule: parentRule,
//                 _process$: empty(),
//                 contextData: {},
//                 complete: false,
//             };

//             const accumulator: Record<string, Observable<CompositeDependencyResponse>> = {};
//             (engine as any).extractCompositeDependencyTasks(accumulator, compositeDependency, context);
//             const tasks = _.entries(accumulator).map((t) => t[1]);
//             concat(...tasks)
//                 .pipe(toArray())
//                 .subscribe({
//                     next: (results: CompositeDependencyResponse[]) => {
//                         expect(extractCompositeDependencyTasksSpy).toBeCalledTimes(1);
//                         expect(results[0].hasError).toBe(true);
//                         expect(results[0].isSkipped).toBe(false);
//                         expect(results[0].isSuccessful).toBe(false);
//                         expect(results[0].rules[0].hasError).toBe(false);
//                         expect(results[0].rules[0].isSkipped).toBe(false);
//                         expect(results[0].rules[0].isSuccessful).toBe(true);
//                         expect(results[0].rules[1].hasError).toBe(true);
//                         expect(results[0].rules[1].isSkipped).toBe(false);
//                         expect(results[0].rules[1].isSuccessful).toBe(false);
//                         done();
//                     },
//                 });
//         });
//     });
// });

// describe('execute', () => {
//     it('should invoke beforeAction hook', (done) => {
//         const beforeActionMock = jest.fn().mockReturnValue(1);
//         const actionMock = jest.fn().mockReturnValue(1);

//         const rule: JasperRule = {
//             name: 'mockRule',
//             description: 'description for mock rule',
//             beforeAction: () => {
//                 return of(beforeActionMock());
//             },
//             action: () => {
//                 return of(actionMock());
//             },
//         };

//         const engine = new JasperEngine({
//             mockRule: rule,
//         });

//         const executeSpy = jest.spyOn(engine as any, 'execute');

//         const root = {
//             children: [
//                 { id: 1, text: 'child1' },
//                 { id: 2, text: 'child2' },
//             ],
//         };

//         (engine as any).execute({ root, ruleName: rule.name }).subscribe({
//             next: (response: ExecutionResponse) => {
//                 expect(beforeActionMock).toBeCalledTimes(1);
//                 expect(actionMock).toBeCalledTimes(1);
//                 expect(executeSpy).toBeCalledTimes(1);
//                 expect(response.result).toBe(1);

//                 done();
//             },
//         });
//     });

//     it('should invoke afterAction hook', (done) => {
//         const afterActionMock = jest.fn().mockReturnValue(1);
//         const actionMock = jest.fn().mockReturnValue(1);

//         const rule: JasperRule = {
//             name: 'mockRule',
//             description: 'description for mock rule',
//             afterAction: (response: ExecutionResponse) => {
//                 return of(response).pipe(
//                     tap(() => {
//                         afterActionMock();
//                     }),
//                 );
//             },
//             action: () => {
//                 return of(actionMock());
//             },
//         };

//         const engine = new JasperEngine({
//             mockRule: rule,
//         }, {
//             recipe: JasperEngineRecipe.ValidationRuleEngine,
//             suppressDuplicateTasks: true,
//             debug: true,
//         });

//         const executeSpy = jest.spyOn(engine as any, 'execute');

//         const root = {
//             children: [
//                 { id: 1, text: 'child1' },
//                 { id: 2, text: 'child2' },
//             ],
//         };

//         const context: ExecutionContext = {
//             contextId: '1',
//             root: {
//                 children: [
//                     { id: 1, text: 'child1' },
//                     { id: 2, text: 'child2' },
//                 ],
//             },
//             rule,
//             _process$: empty(),
//             contextData: {},
//             complete: false,
//         };

//         (engine as any).execute({ root, ruleName: rule.name, parentExecutionContext: context }).subscribe({
//             next: (response: ExecutionResponse) => {
//                 expect(afterActionMock).toBeCalledTimes(1);
//                 expect(actionMock).toBeCalledTimes(1);
//                 expect(executeSpy).toBeCalledTimes(1);
//                 expect(response.result).toBe(1);

//                 done();
//             },
//         });
//     });

//     it('should invoke onError hook and throw error if stream not replaced', done => {
//         const actionMock = jest.fn().mockReturnValue(1);
//         const errorMock = jest.fn();
//         const rule: JasperRule = {
//             name: 'mockRule',
//             description: 'description for mock rule',
//             action: () => {
//                 actionMock();
//                 return throwError(new Error('exception'));
//             },
//             onError: (err) => {
//                 errorMock();
//                 return throwError(err);
//             }
//         };

//         const engine = new JasperEngine({
//             mockRule: rule,
//         });

//         const executeSpy = jest.spyOn(engine as any, 'execute');

//         const root = {
//             children: [
//                 { id: 1, text: 'child1' },
//                 { id: 2, text: 'child2' },
//             ],
//         };

//         (engine as any).execute({ root, ruleName: rule.name }).subscribe({
//             error: (err: any) => {
//                 expect(actionMock).toBeCalledTimes(1);
//                 expect(errorMock).toBeCalledTimes(1);
//                 expect(executeSpy).toBeCalledTimes(1);
//                 expect(err).toBeTruthy();

//                 done();
//             }
//         });
//     });

//     it('should invoke onError hook and replace the stream with what is provided', done => {
//         const actionMock = jest.fn().mockReturnValue(1);
//         const errorMock = jest.fn();
//         const rule: JasperRule = {
//             name: 'mockRule',
//             description: 'description for mock rule',
//             action: () => {
//                 actionMock();
//                 return throwError(new Error('exception'));
//             },
//             onError: () => {
//                 errorMock();
//                 return of('replaced');
//             }
//         };

//         const engine = new JasperEngine({
//             mockRule: rule,
//         });

//         const executeSpy = jest.spyOn(engine as any, 'execute');

//         const root = {
//             children: [
//                 { id: 1, text: 'child1' },
//                 { id: 2, text: 'child2' },
//             ],
//         };

//         (engine as any).execute({ root, ruleName: rule.name }).subscribe({
//             next: (response: ExecutionResponse) => {
//                 expect(actionMock).toBeCalledTimes(1);
//                 expect(errorMock).toBeCalledTimes(1);
//                 expect(executeSpy).toBeCalledTimes(1);
//                 expect(response.result).toBe('replaced');
//                 done();
//             }
//         });
//     });

//     it('should share/multicast the action if option is set to suppress duplicate tasks', (done) => {
//         const actionMock = jest.fn().mockReturnValue(1);

//         const rule: JasperRule = {
//             name: 'mockRule',
//             description: 'description for mock rule',
//             action: () => {
//                 return of(actionMock());
//             },
//         };

//         const engine = new JasperEngine({
//             mockRule: rule,
//         });

//         const executeSpy = jest.spyOn(engine as any, 'execute');

//         const root = {
//             children: [
//                 { id: 1, text: 'child1' },
//                 { id: 2, text: 'child2' },
//             ],
//         };

//         (engine as any).execute({ root, ruleName: rule.name }).subscribe({
//             next: (response: ExecutionResponse) => {
//                 expect(actionMock).toBeCalledTimes(1);
//                 expect(executeSpy).toBeCalledTimes(1);
//                 expect(response.result).toBe(1);
//             },
//         });

//         (engine as any).execute({ root, ruleName: rule.name }).subscribe({
//             next: (response: ExecutionResponse) => {
//                 expect(actionMock).toBeCalledTimes(1);
//                 expect(executeSpy).toBeCalledTimes(2);
//                 expect(response.result).toBe(1);

//                 done();
//             },
//         });
//     });

//     it('should invoke action depending on the number of subscriptions if option is set to not suppress duplicate tasks', (done) => {
//         const actionMock = jest.fn().mockReturnValue(1);

//         const rule: JasperRule = {
//             name: 'mockRule',
//             description: 'description for mock rule',
//             action: () => {
//                 return of(actionMock());
//             },
//         };

//         const engine = new JasperEngine({
//             mockRule: rule,
//         }, {
//             recipe: JasperEngineRecipe.ValidationRuleEngine,
//             suppressDuplicateTasks: false,
//         });

//         const executeSpy = jest.spyOn(engine as any, 'execute');

//         const root = {
//             children: [
//                 { id: 1, text: 'child1' },
//                 { id: 2, text: 'child2' },
//             ],
//         };

//         (engine as any).execute({ root, ruleName: rule.name }).subscribe({
//             next: (response: ExecutionResponse) => {
//                 expect(actionMock).toBeCalledTimes(1);
//                 expect(executeSpy).toBeCalledTimes(1);
//                 expect(response.result).toBe(1);
//             },
//         });

//         (engine as any).execute({ root, ruleName: rule.name }).subscribe({
//             next: (response: ExecutionResponse) => {
//                 expect(actionMock).toBeCalledTimes(2);
//                 expect(executeSpy).toBeCalledTimes(2);
//                 expect(response.result).toBe(1);

//                 done();
//             },
//         });
//     });
// });
