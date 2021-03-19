import { JasperEngine } from '../engine';
import {
    ExecutionContext,
    JasperRule,
    SimpleDependency,
    CompoundDependency,
    Operator,
    ExecutionOrder,
} from '../rule.config';
import { Observable, of, empty, forkJoin, concat, throwError } from 'rxjs';
import _ from 'lodash';
import { switchMap, tap, toArray } from 'rxjs/operators';
import { JasperEngineRecipe } from '../recipe';
import {
    SimpleDependencyExecutionResponse,
    CompoundDependencyExecutionResponse,
    ExecutionResponse,
} from '../execution.response';

describe('processExpression', () => {
    const mockRule: JasperRule = {
        name: 'mockRule',
        description: 'description for mock rule',
        action: of(1),
    };
    it('should handle jsonata path expression', (done) => {
        const engine = new JasperEngine({});
        const processExpressionSpy = jest.spyOn(engine as any, 'processExpression');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
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
        };

        const ob: Observable<any[]> = (engine as any).processExpression(
            of(true).pipe(
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

    it('should handle synchronous function path expression', (done) => {
        const engine = new JasperEngine({});
        const processExpressionSpy = jest.spyOn(engine as any, 'processExpression');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const mockFn = jest.fn().mockReturnValue(_.get(context.root, 'children'));
        const pathFunction = () => {
            return mockFn(context);
        };

        const ob: Observable<any[]> = (engine as any).processExpression(pathFunction, context);

        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(2);
            },
            complete: () => {
                expect(processExpressionSpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(1);
                expect(mockFn).toBeCalledWith(context);
                done();
            },
        });
    });

    it('should handle async function path expression', (done) => {
        const engine = new JasperEngine({});
        const processExpressionSpy = jest.spyOn(engine as any, 'processExpression');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const mockFn = jest.fn().mockResolvedValue(_.get(context.root, 'children'));
        const asyncPathFunction = async (context: ExecutionContext) => {
            return mockFn(context);
        };

        const ob: Observable<any[]> = (engine as any).processExpression(asyncPathFunction, context);

        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(2);
            },
            complete: () => {
                expect(processExpressionSpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(1);
                expect(mockFn).toBeCalledWith(context);
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
        action: of(1),
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

    it('should handle async action expression', (done) => {
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
        };

        const mockFn = jest.fn().mockResolvedValue(123);

        const action = async (context: ExecutionContext) => {
            return mockFn(context);
        };

        const ob: Observable<any> = (engine as any).executeAction({ action, context });

        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(123);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(1);
                expect(mockFn).toBeCalledWith(context);
                done();
            },
        });
    });

    it('should handle synchronous action expression', (done) => {
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
        };

        const mockFn = jest.fn().mockReturnValue(123);
        const action = (context: ExecutionContext) => {
            return mockFn(context);
        };

        const ob: Observable<any> = (engine as any).executeAction({ action, context });

        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(123);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(1);
                expect(mockFn).toBeCalledWith(context);
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
        action: of(1),
    };

    it('should put no tasks on accumulator if pathExpression does not find anything', () => {
        const engine = new JasperEngine({});
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'notfound',
            rule: 'test rule',
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
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const accumulator: Record<string, Observable<any>> = {};

        (engine as any).processSimpleDependency(accumulator, simpleDependency, context);

        expect(processSimpleDependencySpy).toBeCalledTimes(1);
        expect(_.entries(accumulator)).toHaveLength(0);
    });

    it('should return response with error if unable to evaluate path expression', (done) => {
        const engine = new JasperEngine({});
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');
        const mockFn = jest.fn().mockImplementation(() => {
            throw new Error('path error');
        });
        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: () => {
                mockFn();
            },
            rule: 'test rule',
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
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const accumulator: Record<string, Observable<any>> = {};
        (engine as any).processSimpleDependency(accumulator, simpleDependency, context);
        expect(processSimpleDependencySpy).toBeCalledTimes(1);
        expect(_.entries(accumulator)).toHaveLength(1);

        accumulator[simpleDependency.name].subscribe({
            next: (result: SimpleDependencyExecutionResponse) => {
                expect(mockFn).toBeCalledTimes(1);
                expect(result.hasError).toBe(true);
                done();
            },
        });
    });

    it('should put N tasks on accumulator if pathExpression return N matches', () => {
        const engine = new JasperEngine({});
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: 'test rule',
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
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const accumulator: Record<string, Observable<any>> = {};

        (engine as any).processSimpleDependency(accumulator, simpleDependency, context);

        expect(processSimpleDependencySpy).toBeCalledTimes(1);
        expect(_.entries(accumulator)).toHaveLength(context.root.children.length);
    });

    it('should return debugContext if debugging mode is enabled', (done) => {
        const mockFn = jest.fn().mockReturnValue(1);
        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                return mockFn();
            },
        };

        const engine = new JasperEngine(
            {
                mockRule: rule,
            },
            {
                recipe: JasperEngineRecipe.ValidationRuleEngine,
                suppressDuplicateTasks: true,
                debug: true,
            }
        );

        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: rule.name,
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: rule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const accumulator: Record<string, Observable<any>> = {};

        (engine as any).processSimpleDependency(accumulator, simpleDependency, context);
        const tasks = _.entries(accumulator).map((c) => c[1]);
        expect(processSimpleDependencySpy).toBeCalledTimes(1);
        expect(tasks).toHaveLength(context.root.children.length);

        forkJoin(tasks).subscribe({
            next: (results: SimpleDependencyExecutionResponse[]) => {
                expect(mockFn).toBeCalledTimes(2);
                expect(_.filter(results, (r) => r.isSuccessful)).toHaveLength(2);
                expect(_.filter(results, (r) => r.debugContext)).toHaveLength(2);
                done();
            },
        });
    });

    it('should catch exception and return error under execution response', (done) => {
        const mockFn = jest
            .fn()
            .mockImplementationOnce(() => {
                throw new Error('error');
            })
            .mockResolvedValueOnce(1);

        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                return mockFn();
            },
        };

        const engine = new JasperEngine(
            {
                mockRule: rule,
            },
            {
                recipe: JasperEngineRecipe.ValidationRuleEngine,
                suppressDuplicateTasks: true,
                debug: false,
            }
        );

        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: rule.name,
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule: rule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const accumulator: Record<string, Observable<any>> = {};

        (engine as any).processSimpleDependency(accumulator, simpleDependency, context);
        const tasks = _.entries(accumulator).map((c) => c[1]);
        expect(processSimpleDependencySpy).toBeCalledTimes(1);
        expect(tasks).toHaveLength(context.root.children.length);

        forkJoin(tasks).subscribe({
            next: (results: SimpleDependencyExecutionResponse[]) => {
                expect(mockFn).toBeCalledTimes(2);
                expect(_.filter(results, (r) => r.isSuccessful)).toHaveLength(1);
                expect(_.filter(results, (r) => r.debugContext)).toHaveLength(0);
                expect(_.filter(results, (r) => r.hasError)).toHaveLength(1);
                done();
            },
        });
    });
});

describe('collectDependencyTasks', () => {
    describe('extractSimpleDependencyTasks', () => {
        it('should return response with error if unable to evaluate when expression', (done) => {
            const rule: JasperRule = {
                name: 'mockRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };
            const engine = new JasperEngine({
                mockRule: rule,
            });

            const extractSimpleDependencyTasksSpy = jest.spyOn(engine as any, 'extractSimpleDependencyTasks');

            const simpleDependency: SimpleDependency = {
                name: 'simple dependency',
                rule: rule.name,
                path: '$',
                when: () => {
                    throw new Error('path error');
                },
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<SimpleDependencyExecutionResponse>> = {};
            (engine as any).extractSimpleDependencyTasks(accumulator, simpleDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: SimpleDependencyExecutionResponse[]) => {
                        expect(extractSimpleDependencyTasksSpy).toBeCalledTimes(1);
                        expect(results[0].hasError).toBe(true);
                        expect(results[0].isSuccessful).toBe(false);
                        done();
                    },
                });
        });

        it('should run simple dependency if when expression is not defined', (done) => {
            const rule: JasperRule = {
                name: 'mockRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };
            const engine = new JasperEngine({
                mockRule: rule,
            });

            const extractSimpleDependencyTasksSpy = jest.spyOn(engine as any, 'extractSimpleDependencyTasks');
            const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

            const simpleDependency: SimpleDependency = {
                name: 'simple dependency',
                rule: rule.name,
                path: '$',
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<SimpleDependencyExecutionResponse>> = {};
            (engine as any).extractSimpleDependencyTasks(accumulator, simpleDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: SimpleDependencyExecutionResponse[]) => {
                        expect(extractSimpleDependencyTasksSpy).toBeCalledTimes(1);
                        expect(processSimpleDependencySpy).toBeCalledTimes(1);
                        expect(results[0].hasError).toBe(false);
                        expect(results[0].isSuccessful).toBe(true);
                        expect(results[0].result).toBe(1);
                        done();
                    },
                });
        });

        it('should skip simple dependency if when expression evaluates to false', (done) => {
            const rule: JasperRule = {
                name: 'mockRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };
            const engine = new JasperEngine({
                mockRule: rule,
            });

            const extractSimpleDependencyTasksSpy = jest.spyOn(engine as any, 'extractSimpleDependencyTasks');
            const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

            const simpleDependency: SimpleDependency = {
                name: 'simple dependency',
                rule: rule.name,
                path: '$',
                when: 'false',
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<SimpleDependencyExecutionResponse>> = {};
            (engine as any).extractSimpleDependencyTasks(accumulator, simpleDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: SimpleDependencyExecutionResponse[]) => {
                        expect(extractSimpleDependencyTasksSpy).toBeCalledTimes(1);
                        expect(processSimpleDependencySpy).toBeCalledTimes(0);
                        expect(results[0].hasError).toBe(false);
                        expect(results[0].isSuccessful).toBe(true);
                        expect(results[0].isSkipped).toBe(true);
                        expect(results[0].result).toBe(null);
                        done();
                    },
                });
        });
    });

    describe('extractCompoundDependencyTasks', () => {
        it('should return response with error if unable to evaluate when expression', (done) => {
            const engine = new JasperEngine({});
            const extractCompoundDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompoundDependencyTasks');
            const rule: JasperRule = {
                name: 'mockRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const compoundDependency: CompoundDependency = {
                name: 'test compound dependency',
                rules: [
                    {
                        name: 'compound dependency',
                        rule: rule.name,
                        path: '$',
                    },
                ],
                when: () => {
                    throw new Error('path error');
                },
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<CompoundDependencyExecutionResponse>> = {};
            (engine as any).extractCompoundDependencyTasks(accumulator, compoundDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: CompoundDependencyExecutionResponse[]) => {
                        expect(extractCompoundDependencyTasksSpy).toBeCalledTimes(1);
                        expect(results[0].hasError).toBe(true);
                        expect(results[0].isSuccessful).toBe(false);
                        done();
                    },
                });
        });

        it('should skip compound dependency if when express evalutes to false', (done) => {
            const rule: JasperRule = {
                name: 'mockRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const engine = new JasperEngine({
                mockRule: rule,
            });

            const extractCompoundDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompoundDependencyTasks');

            const compoundDependency: CompoundDependency = {
                name: 'test compound dependency',
                rules: [
                    {
                        name: 'compound dependency',
                        rule: rule.name,
                        path: '$',
                    },
                ],
                when: of(false),
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<CompoundDependencyExecutionResponse>> = {};
            (engine as any).extractCompoundDependencyTasks(accumulator, compoundDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: CompoundDependencyExecutionResponse[]) => {
                        expect(extractCompoundDependencyTasksSpy).toBeCalledTimes(1);
                        expect(results[0].hasError).toBe(false);
                        expect(results[0].isSkipped).toBe(true);
                        expect(results[0].isSuccessful).toBe(true);
                        done();
                    },
                });
        });

        it('should extract compound dependency tasks if when is not defined', (done) => {
            const parentRule: JasperRule = {
                name: 'parentRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const mockRule1: JasperRule = {
                name: 'mockRule1',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const mockRule2: JasperRule = {
                name: 'mockRule2',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const engine = new JasperEngine({
                parentRule,
                mockRule1,
                mockRule2,
            });

            const extractCompoundDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompoundDependencyTasks');

            const compoundDependency: CompoundDependency = {
                name: 'test compound dependency',
                rules: [
                    {
                        name: 'child dependency 1',
                        rule: mockRule1.name,
                        path: '$',
                    },
                    {
                        name: 'child dependency 2',
                        rule: mockRule2.name,
                        path: '$',
                    },
                ],
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule: parentRule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<CompoundDependencyExecutionResponse>> = {};
            (engine as any).extractCompoundDependencyTasks(accumulator, compoundDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: CompoundDependencyExecutionResponse[]) => {
                        expect(extractCompoundDependencyTasksSpy).toBeCalledTimes(1);
                        expect(results[0].hasError).toBe(false);
                        expect(results[0].isSkipped).toBe(false);
                        expect(results[0].isSuccessful).toBe(true);
                        expect(results[0].rules[0].hasError).toBe(false);
                        expect(results[0].rules[0].isSkipped).toBe(false);
                        expect(results[0].rules[0].isSuccessful).toBe(true);
                        expect(results[0].rules[1].hasError).toBe(false);
                        expect(results[0].rules[1].isSkipped).toBe(false);
                        expect(results[0].rules[1].isSuccessful).toBe(true);
                        done();
                    },
                });
        });
    });
});

describe('processCompoundDependency', () => {
    describe('operator OR', () => {
        it('consider compound compendency to be successful if either dependency task is successful', (done) => {
            const parentRule: JasperRule = {
                name: 'parentRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const mockRule1: JasperRule = {
                name: 'mockRule1',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const mockRule2: JasperRule = {
                name: 'mockRule2',
                description: 'description for mock rule',
                action: () => {
                    throw new Error('error');
                },
            };

            const engine = new JasperEngine({
                parentRule,
                mockRule1,
                mockRule2,
            });

            const extractCompoundDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompoundDependencyTasks');

            const compoundDependency: CompoundDependency = {
                name: 'test compound dependency',
                operator: Operator.OR,
                executionOrder: ExecutionOrder.Sequential,
                rules: [
                    {
                        name: 'child dependency 1',
                        rule: mockRule1.name,
                        path: '$',
                    },
                    {
                        name: 'child dependency 2',
                        rule: mockRule2.name,
                        path: '$',
                    },
                ],
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule: parentRule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<CompoundDependencyExecutionResponse>> = {};
            (engine as any).extractCompoundDependencyTasks(accumulator, compoundDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: CompoundDependencyExecutionResponse[]) => {
                        expect(extractCompoundDependencyTasksSpy).toBeCalledTimes(1);
                        expect(results[0].hasError).toBe(false);
                        expect(results[0].isSkipped).toBe(false);
                        expect(results[0].isSuccessful).toBe(true);
                        expect(results[0].rules[0].hasError).toBe(false);
                        expect(results[0].rules[0].isSkipped).toBe(false);
                        expect(results[0].rules[0].isSuccessful).toBe(true);
                        expect(results[0].rules[1].hasError).toBe(true);
                        expect(results[0].rules[1].isSkipped).toBe(false);
                        expect(results[0].rules[1].isSuccessful).toBe(false);
                        done();
                    },
                });
        });

        it('consider compound compendency to be unsuccessful if all dependency task are unsuccessful', (done) => {
            const parentRule: JasperRule = {
                name: 'parentRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const mockRule1: JasperRule = {
                name: 'mockRule1',
                description: 'description for mock rule',
                action: () => {
                    throw new Error('error');
                },
            };

            const mockRule2: JasperRule = {
                name: 'mockRule2',
                description: 'description for mock rule',
                action: () => {
                    throw new Error('error');
                },
            };

            const engine = new JasperEngine({
                parentRule,
                mockRule1,
                mockRule2,
            });

            const extractCompoundDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompoundDependencyTasks');

            const compoundDependency: CompoundDependency = {
                name: 'test compound dependency',
                operator: Operator.OR,
                executionOrder: ExecutionOrder.Sequential,
                rules: [
                    {
                        name: 'child dependency 1',
                        rule: mockRule1.name,
                        path: '$',
                    },
                    {
                        name: 'child dependency 2',
                        rule: mockRule2.name,
                        path: '$',
                    },
                ],
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule: parentRule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<CompoundDependencyExecutionResponse>> = {};
            (engine as any).extractCompoundDependencyTasks(accumulator, compoundDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: CompoundDependencyExecutionResponse[]) => {
                        expect(extractCompoundDependencyTasksSpy).toBeCalledTimes(1);
                        expect(results[0].hasError).toBe(true);
                        expect(results[0].isSkipped).toBe(false);
                        expect(results[0].isSuccessful).toBe(false);
                        expect(results[0].rules[0].hasError).toBe(true);
                        expect(results[0].rules[0].isSkipped).toBe(false);
                        expect(results[0].rules[0].isSuccessful).toBe(false);
                        expect(results[0].rules[1].hasError).toBe(true);
                        expect(results[0].rules[1].isSkipped).toBe(false);
                        expect(results[0].rules[1].isSuccessful).toBe(false);
                        done();
                    },
                });
        });
    });

    describe('operator AND', () => {
        it('consider compound compendency to be successful if all dependency tasks are successful', (done) => {
            const parentRule: JasperRule = {
                name: 'parentRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const mockRule1: JasperRule = {
                name: 'mockRule1',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const mockRule2: JasperRule = {
                name: 'mockRule2',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const engine = new JasperEngine({
                parentRule,
                mockRule1,
                mockRule2,
            });

            const extractCompoundDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompoundDependencyTasks');

            const compoundDependency: CompoundDependency = {
                name: 'test compound dependency',
                operator: Operator.AND,
                executionOrder: ExecutionOrder.Sequential,
                rules: [
                    {
                        name: 'child dependency 1',
                        rule: mockRule1.name,
                        path: '$',
                    },
                    {
                        name: 'child dependency 2',
                        rule: mockRule2.name,
                        path: '$',
                    },
                ],
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule: parentRule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<CompoundDependencyExecutionResponse>> = {};
            (engine as any).extractCompoundDependencyTasks(accumulator, compoundDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: CompoundDependencyExecutionResponse[]) => {
                        expect(extractCompoundDependencyTasksSpy).toBeCalledTimes(1);
                        expect(results[0].hasError).toBe(false);
                        expect(results[0].isSkipped).toBe(false);
                        expect(results[0].isSuccessful).toBe(true);
                        expect(results[0].rules[0].hasError).toBe(false);
                        expect(results[0].rules[0].isSkipped).toBe(false);
                        expect(results[0].rules[0].isSuccessful).toBe(true);
                        expect(results[0].rules[1].hasError).toBe(false);
                        expect(results[0].rules[1].isSkipped).toBe(false);
                        expect(results[0].rules[1].isSuccessful).toBe(true);
                        done();
                    },
                });
        });

        it('consider compound compendency to be unsuccessful if either dependency task is unsuccessful', (done) => {
            const parentRule: JasperRule = {
                name: 'parentRule',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const mockRule1: JasperRule = {
                name: 'mockRule1',
                description: 'description for mock rule',
                action: () => {
                    return 1;
                },
            };

            const mockRule2: JasperRule = {
                name: 'mockRule2',
                description: 'description for mock rule',
                action: () => {
                    throw new Error('error');
                },
            };

            const engine = new JasperEngine({
                parentRule,
                mockRule1,
                mockRule2,
            });

            const extractCompoundDependencyTasksSpy = jest.spyOn(engine as any, 'extractCompoundDependencyTasks');

            const compoundDependency: CompoundDependency = {
                name: 'test compound dependency',
                operator: Operator.AND,
                executionOrder: ExecutionOrder.Sequential,
                rules: [
                    {
                        name: 'child dependency 1',
                        rule: mockRule1.name,
                        path: '$',
                    },
                    {
                        name: 'child dependency 2',
                        rule: mockRule2.name,
                        path: '$',
                    },
                ],
            };

            const context: ExecutionContext = {
                contextId: '1',
                root: {
                    children: [
                        { id: 1, text: 'child1' },
                        { id: 2, text: 'child2' },
                    ],
                },
                rule: parentRule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<string, Observable<CompoundDependencyExecutionResponse>> = {};
            (engine as any).extractCompoundDependencyTasks(accumulator, compoundDependency, context);
            const tasks = _.entries(accumulator).map((t) => t[1]);
            concat(...tasks)
                .pipe(toArray())
                .subscribe({
                    next: (results: CompoundDependencyExecutionResponse[]) => {
                        expect(extractCompoundDependencyTasksSpy).toBeCalledTimes(1);
                        expect(results[0].hasError).toBe(true);
                        expect(results[0].isSkipped).toBe(false);
                        expect(results[0].isSuccessful).toBe(false);
                        expect(results[0].rules[0].hasError).toBe(false);
                        expect(results[0].rules[0].isSkipped).toBe(false);
                        expect(results[0].rules[0].isSuccessful).toBe(true);
                        expect(results[0].rules[1].hasError).toBe(true);
                        expect(results[0].rules[1].isSkipped).toBe(false);
                        expect(results[0].rules[1].isSuccessful).toBe(false);
                        done();
                    },
                });
        });
    });
});

describe('execute', () => {
    it('should invoke beforeAction hook', (done) => {
        const beforeActionMock = jest.fn().mockReturnValue(1);
        const actionMock = jest.fn().mockReturnValue(1);

        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            beforeAction: () => {
                return of(beforeActionMock());
            },
            action: () => {
                return actionMock();
            },
        };

        const engine = new JasperEngine({
            mockRule: rule,
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        (engine as any).execute({ root, ruleName: rule.name }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(beforeActionMock).toBeCalledTimes(1);
                expect(actionMock).toBeCalledTimes(1);
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.result).toBe(1);

                done();
            },
        });
    });

    it('should invoke afterAction hook', (done) => {
        const afterActionMock = jest.fn().mockReturnValue(1);
        const actionMock = jest.fn().mockReturnValue(1);

        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            afterAction: (response: ExecutionResponse) => {
                return of(response).pipe(
                    tap(() => {
                        afterActionMock();
                    }),
                );
            },
            action: () => {
                return actionMock();
            },
        };

        const engine = new JasperEngine({
            mockRule: rule,
        }, {
            recipe: JasperEngineRecipe.ValidationRuleEngine,
            suppressDuplicateTasks: true,
            debug: true,
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        const context: ExecutionContext = {
            contextId: '1',
            root: {
                children: [
                    { id: 1, text: 'child1' },
                    { id: 2, text: 'child2' },
                ],
            },
            rule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        (engine as any).execute({ root, ruleName: rule.name, parentExecutionContext: context }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(afterActionMock).toBeCalledTimes(1);
                expect(actionMock).toBeCalledTimes(1);
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.result).toBe(1);

                done();
            },
        });
    });

    it('should invoke onError hook and throw error if stream not replaced', done => {
        const actionMock = jest.fn().mockReturnValue(1);
        const errorMock = jest.fn();
        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                actionMock();
                throw new Error('exception');
            },
            onError: (err) => {
                errorMock();
                return throwError(err);
            }
        };

        const engine = new JasperEngine({
            mockRule: rule,
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        (engine as any).execute({ root, ruleName: rule.name }).subscribe({
            error: (err: any) => {
                expect(actionMock).toBeCalledTimes(1);
                expect(errorMock).toBeCalledTimes(1);
                expect(executeSpy).toBeCalledTimes(1);
                expect(err).toBeTruthy();

                done();
            }
        });
    });

    it('should invoke onError hook and replace the stream with what is provided', done => {
        const actionMock = jest.fn().mockReturnValue(1);
        const errorMock = jest.fn();
        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                actionMock();
                throw new Error('exception');
            },
            onError: () => {
                errorMock();
                return of('replaced');
            }
        };

        const engine = new JasperEngine({
            mockRule: rule,
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        (engine as any).execute({ root, ruleName: rule.name }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(actionMock).toBeCalledTimes(1);
                expect(errorMock).toBeCalledTimes(1);
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.result).toBe('replaced');
                done();
            }
        });
    });

    it('should share/multicast the action if option is set to suppress duplicate tasks', (done) => {
        const actionMock = jest.fn().mockReturnValue(1);

        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                return actionMock();
            },
        };

        const engine = new JasperEngine({
            mockRule: rule,
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        (engine as any).execute({ root, ruleName: rule.name }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(actionMock).toBeCalledTimes(1);
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.result).toBe(1);
            },
        });

        (engine as any).execute({ root, ruleName: rule.name }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(actionMock).toBeCalledTimes(1);
                expect(executeSpy).toBeCalledTimes(2);
                expect(response.result).toBe(1);

                done();
            },
        });
    });

    it('should invoke action depending on the number of subscriptions if option is set to not suppress duplicate tasks', (done) => {
        const actionMock = jest.fn().mockReturnValue(1);

        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                return actionMock();
            },
        };

        const engine = new JasperEngine({
            mockRule: rule,
        }, {
            recipe: JasperEngineRecipe.ValidationRuleEngine,
            suppressDuplicateTasks: false,
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        (engine as any).execute({ root, ruleName: rule.name }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(actionMock).toBeCalledTimes(1);
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.result).toBe(1);
            },
        });

        (engine as any).execute({ root, ruleName: rule.name }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(actionMock).toBeCalledTimes(2);
                expect(executeSpy).toBeCalledTimes(2);
                expect(response.result).toBe(1);

                done();
            },
        });
    });
});
