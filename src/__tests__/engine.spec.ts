import { JasperEngine } from '../engine';
import { ExecutionContext, DefaultEngineOptions, JasperRule } from '../rule.config';
import { Observable, of, empty } from 'rxjs';
import _ from 'lodash';
import { switchMap } from 'rxjs/operators';
describe('processPath', () => {
    const mockRule: JasperRule = {
        name: 'mockRule',
        description: 'description for mock rule',
        action: of(1),
    };
    it('should handle jsonata path expression', done => {
        const engine = new JasperEngine({});
        const processPathSpy = jest.spyOn(engine as any, 'processPath');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
            complete: false,
        };

        const ob: Observable<any[]> = (engine as any).processPath('children', context);
        
        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(2);
            },
            complete: () => {
                expect(processPathSpy).toBeCalledTimes(1);
                done();
            }
        });
    });

    it('should handle observable path expression', done => {
        const engine = new JasperEngine({});
        const processPathSpy = jest.spyOn(engine as any, 'processPath');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
            complete: false,
        };

        const ob: Observable<any[]> = (engine as any).processPath(of(true).pipe(
            switchMap(() => {
                return of(_.get(context.root, 'children'));
            }),
        ), context);
        
        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(2);
            },
            complete: () => {
                expect(processPathSpy).toBeCalledTimes(1);
                done();
            }
        });
    });

    it('should handle synchronous function path expression', done => {
        const engine = new JasperEngine({});
        const processPathSpy = jest.spyOn(engine as any, 'processPath');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
            complete: false,
        };

        const mock = jest.fn().mockReturnValue(_.get(context.root, 'children'));
        const pathFunction = (context: ExecutionContext) => {
            return mock();
        };

        const ob: Observable<any[]> = (engine as any).processPath(pathFunction, context);

        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(2);
            },
            complete: () => {
                expect(processPathSpy).toBeCalledTimes(1);
                expect(mock).toBeCalledTimes(1);
                done();
            }
        });
    });

    it('should handle async function path expression', done => {
        const engine = new JasperEngine({});
        const processPathSpy = jest.spyOn(engine as any, 'processPath');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
            complete: false,
        };

        const mock = jest.fn().mockResolvedValue(_.get(context.root, 'children'));
        const asyncPathFunction = async (context: ExecutionContext) => {
            return mock();
        };

        const ob: Observable<any[]> = (engine as any).processPath(asyncPathFunction, context);

        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects).toHaveLength(2);
            },
            complete: () => {
                expect(processPathSpy).toBeCalledTimes(1);
                expect(mock).toBeCalledTimes(1);
                done();
            }
        });
    });

    it('should return [] otherwise', done => {
        const engine = new JasperEngine({});
        const processPathSpy = jest.spyOn(engine as any, 'processPath');
        const context: ExecutionContext = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
            complete: false,
        };

        const ob: Observable<any[]> = (engine as any).processPath(null, context);

        ob.subscribe({
            next: (pahtObjects: any[]) => {
                expect(pahtObjects.length).toBe(0);
            },
            complete: () => {
                expect(processPathSpy).toBeCalledTimes(1);
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
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
            complete: false,
        };

        const action: string = 'children[id=1]';

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
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
            complete: false,
        };

        const action: String = new String('children[id=1]');

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
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
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
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
            complete: false,
        };

        const mock = jest.fn().mockResolvedValue(123);

        const action = async () => {
            return mock();
        }

        const ob: Observable<any> = (engine as any).executeAction({action, context});
        
        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(123);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                expect(mock).toBeCalledTimes(1);
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
            options: DefaultEngineOptions,
            rule: mockRule,
            process: empty(),
            complete: false,
        };

        const mock = jest.fn().mockReturnValue(123);
        const action = () => {
            return mock();
        }

        const ob: Observable<any> = (engine as any).executeAction({action, context});
        
        ob.subscribe({
            next: (result: any) => {
                expect(result).toBe(123);
            },
            complete: () => {
                expect(executeActionSpy).toBeCalledTimes(1);
                expect(mock).toBeCalledTimes(1);
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