import { JasperEngine } from '../engine';
import { ExecutionContext, JasperRule, SimpleDependency, CompoundDependency } from '../rule.config';
import { Observable, of, empty, from, forkJoin, concat } from 'rxjs';
import _ from 'lodash';
import { switchMap, concatAll, tap, toArray } from 'rxjs/operators';
import { JasperEngineRecipe } from '../recipe';
import { SimpleDependencyExecutionResponse, CompoundDependencyExecutionResponse } from '../execution.response';

describe('processExpression', () => {
    const mockRule: JasperRule = {
        name: 'mockRule',
        description: 'description for mock rule',
        action: of(1),
    };
    it('should handle jsonata path expression', done => {
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
            }
        });
    });

    it('should handle observable path expression', done => {
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

        const ob: Observable<any[]> = (engine as any).processExpression(of(true).pipe(
            switchMap(() => {
                return of(_.get(context.root, 'children'));
            }),
        ), context);
        
        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(2);
            },
            complete: () => {
                expect(processExpressionSpy).toBeCalledTimes(1);
                done();
            }
        });
    });

    it('should handle synchronous function path expression', done => {
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
            }
        });
    });

    it('should handle async function path expression', done => {
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
            }
        });
    });

    it('should return [] otherwise', done => {
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
            }
        });
    })
});

describe('executeAction', () => {
    const mockRule: JasperRule = {
        name: 'mockRule',
        description: 'description for mock rule',
        action: of(1),
    };
    
    it('should handle jsonata action expression', done => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
            },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const action = 'children[id=1]';

        const ob: Observable<any> = (engine as any).executeAction({action, context});
        
        ob.subscribe({
            next: (result: any) => {
                expect(result).toMatchObject(context.root.children[0]);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                done();
            }
        });
    });

    it('should handle String jsonata action expression', done => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
            },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const action = new String('children[id=1]');

        const ob: Observable<any> = (engine as any).executeAction({action, context});
        
        ob.subscribe({
            next: (result: any) => {
                expect(result).toMatchObject(context.root.children[0]);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                done();
            }
        });
    });

    it('should handle observable action expression', done => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
            },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const action = of(123);

        const ob: Observable<any> = (engine as any).executeAction({action, context});
        
        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(123);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                done();
            }
        });
    });

    it('should handle async action expression', done => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
            },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const mockFn = jest.fn().mockResolvedValue(123);

        const action = async (context: ExecutionContext) => {
            return mockFn(context);
        }

        const ob: Observable<any> = (engine as any).executeAction({action, context});
        
        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(123);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(1);
                expect(mockFn).toBeCalledWith(context);
                done();
            }
        });
    });

    it('should handle synchronous action expression', done => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
            },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const mockFn = jest.fn().mockReturnValue(123);
        const action = (context: ExecutionContext) => {
            return mockFn(context);
        }

        const ob: Observable<any> = (engine as any).executeAction({action, context});
        
        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(123);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(1);
                expect(mockFn).toBeCalledWith(context);
                done();
            }
        });
    });

    it('should return null if invalid expression passed', done => {
        const engine = new JasperEngine({});
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');

        const action = 1;
        const ob: Observable<any> = (engine as any).executeAction({action, context: {}});
        
        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(null);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                done();
            }
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
        }

        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
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

    it('should return response with error if unable to evaluate path expression', done => {
        const engine = new JasperEngine({});
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');
        const mockFn = jest.fn().mockImplementation(() => {
            throw new Error('path error')
        });
        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: () => { mockFn(); },
            rule: 'test rule',
        }

        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
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
        }

        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
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

    it('should return debugContext if debugging mode is enabled', done => {
        const mockFn = jest.fn().mockReturnValue(1);
        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => { return mockFn(); },
        };

        const engine = new JasperEngine({
            mockRule: rule,
        }, {
            recipe: JasperEngineRecipe.ValidationRuleEngine,
            suppressDuplicateTasks: true,
            debug: true,
        });

        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: rule.name,
        }

        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
            },
            rule: rule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const accumulator: Record<string, Observable<any>> = {};

        (engine as any).processSimpleDependency(accumulator, simpleDependency, context);
        const tasks = _.entries(accumulator).map(c => c[1]);
        expect(processSimpleDependencySpy).toBeCalledTimes(1);
        expect(tasks).toHaveLength(context.root.children.length);

        forkJoin(tasks).subscribe({
            next: (results: SimpleDependencyExecutionResponse[]) => {
                expect(mockFn).toBeCalledTimes(2);
                expect(_.filter(results, r => r.isSuccessful)).toHaveLength(2);
                expect(_.filter(results, r => r.debugContext)).toHaveLength(2);
                done();
            },
        });
    });

    it('should catch exception and return error under execution response', done => {
        const mockFn = jest.fn()
            .mockImplementationOnce(() => {
                throw new Error('error');
            })
            .mockResolvedValueOnce(1);

        const rule: JasperRule = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => { return mockFn(); },
        };

        const engine = new JasperEngine({
            mockRule: rule,
        }, {
            recipe: JasperEngineRecipe.ValidationRuleEngine,
            suppressDuplicateTasks: true,
            debug: false,
        });

        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: rule.name,
        }

        const context: ExecutionContext = {
            contextId: '1',
            root: { 
                children: [
                    { id: 1, text: 'child1' }, 
                    { id: 2, text: 'child2' }
                ]
            },
            rule: rule,
            _process$: empty(),
            contextData: {},
            complete: false,
        };

        const accumulator: Record<string, Observable<any>> = {};

        (engine as any).processSimpleDependency(accumulator, simpleDependency, context);
        const tasks = _.entries(accumulator).map(c => c[1]);
        expect(processSimpleDependencySpy).toBeCalledTimes(1);
        expect(tasks).toHaveLength(context.root.children.length);

        forkJoin(tasks).subscribe({
            next: (results: SimpleDependencyExecutionResponse[]) => {
                expect(mockFn).toBeCalledTimes(2);
                expect(_.filter(results, r => r.isSuccessful)).toHaveLength(1);
                expect(_.filter(results, r => r.debugContext)).toHaveLength(0);
                expect(_.filter(results, r => r.hasError)).toHaveLength(1);
                done();
            },
        });
    });
});

describe('collectDependencyTasks', () => {
    describe('simpleDependency is nested under compound dependency', () => {
        it('should return response with error if unable to evaluate when expression', done => {
            const engine = new JasperEngine({});
            const collectDependencyTasksSpy = jest.spyOn(engine as any, 'collectDependencyTasks');
            const rule: JasperRule = {
                name: 'mockRule',
                description: 'description for mock rule',
                action: () => { return 1; },
            };

            const compoundDependency: CompoundDependency = {
                name: 'test simple dependency',
                rules: [{
                    name: 'simple dependency',
                    rule: rule.name,
                    path: '$',
                    when: () => { throw new Error('path error') },
                }]
            }
    
            const context: ExecutionContext = {
                contextId: '1',
                root: { 
                    children: [
                        { id: 1, text: 'child1' }, 
                        { id: 2, text: 'child2' }
                    ]
                },
                rule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };
    
            const accumulator: Record<
                string,
                Observable<SimpleDependencyExecutionResponse>
            > = (engine as any).collectDependencyTasks(compoundDependency, context);
            const tasks = _.entries(accumulator).map(t => t[1]);
            concat(...tasks).pipe(
                toArray(),
            ).subscribe({
                next: (results: SimpleDependencyExecutionResponse[]) => {
                    expect(collectDependencyTasksSpy).toBeCalledTimes(1);
                    expect(results[0].hasError).toBe(true);
                    expect(results[0].isSuccessful).toBe(false);
                    done();
                },
            });
        });

        it('should run simple dependency if when expression is not defined', done => {
            const rule: JasperRule = {
                name: 'mockRule',
                description: 'description for mock rule',
                action: () => { return 1; },
            };
            const engine = new JasperEngine({
                mockRule: rule
            });

            const collectDependencyTasksSpy = jest.spyOn(engine as any, 'collectDependencyTasks');
            const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

            const compoundDependency: CompoundDependency = {
                name: 'test simple dependency',
                rules: [{
                    name: 'simple dependency',
                    rule: rule.name,
                    path: '$',
                }]
            }
    
            const context: ExecutionContext = {
                contextId: '1',
                root: { 
                    children: [
                        { id: 1, text: 'child1' }, 
                        { id: 2, text: 'child2' }
                    ]
                },
                rule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };

            const accumulator: Record<
                string,
                Observable<SimpleDependencyExecutionResponse>
            > = (engine as any).collectDependencyTasks(compoundDependency, context);
            const tasks = _.entries(accumulator).map(t => t[1]);
            concat(...tasks).pipe(
                toArray(),
            ).subscribe({
                next: (results: SimpleDependencyExecutionResponse[]) => {
                    expect(collectDependencyTasksSpy).toBeCalledTimes(1);
                    expect(processSimpleDependencySpy).toBeCalledTimes(1);
                    expect(results[0].hasError).toBe(false);
                    expect(results[0].isSuccessful).toBe(true);
                    expect((results[0].result)).toBe(1);
                    done();
                },
            });
        });

        it('should skip simple dependency if when expression evaluates to false', done => {
            const rule: JasperRule = {
                name: 'mockRule',
                description: 'description for mock rule',
                action: () => { return 1; },
            };
            const engine = new JasperEngine({
                mockRule: rule
            });
            
            const collectDependencyTasksSpy = jest.spyOn(engine as any, 'collectDependencyTasks');
            const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');
            

            const compoundDependency: CompoundDependency = {
                name: 'test simple dependency',
                rules: [{
                    name: 'simple dependency',
                    rule: rule.name,
                    path: '$',
                    when: 'false',
                }]
            }
    
            const context: ExecutionContext = {
                contextId: '1',
                root: { 
                    children: [
                        { id: 1, text: 'child1' }, 
                        { id: 2, text: 'child2' }
                    ]
                },
                rule,
                _process$: empty(),
                contextData: {},
                complete: false,
            };
    
            const accumulator: Record<
                string,
                Observable<SimpleDependencyExecutionResponse>
            > = (engine as any).collectDependencyTasks(compoundDependency, context);
            const tasks = _.entries(accumulator).map(t => t[1]);
            concat(...tasks).pipe(
                toArray(),
            ).subscribe({
                next: (results: SimpleDependencyExecutionResponse[]) => {
                    expect(collectDependencyTasksSpy).toBeCalledTimes(1);
                    expect(processSimpleDependencySpy).toBeCalledTimes(0);
                    expect(results[0].hasError).toBe(false);
                    expect(results[0].isSuccessful).toBe(true);
                    expect(results[0].isSkipped).toBe(true);
                    expect((results[0].result)).toBe(null);
                    done();
                },
            });
        });
    });
});