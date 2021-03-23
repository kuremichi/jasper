/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { JasperEngine } from '../engine';

import { Observable, of, empty, throwError } from 'rxjs';
import _ from 'lodash';
import { switchMap, tap } from 'rxjs/operators';

import { Rule } from '../rule';
import { ExecutionContext } from '../execution.context';
import { ExecutionOrder, EngineRecipe, Operator } from '../enum';
import { SimpleDependency } from '../dependency/simple.dependency';
import { CompositeDependency } from '../dependency/composite.dependency';
import { CompositeDependencyResponse } from '../dependency/composite.dependency.response';
import { ExecutionResponse } from '../execution.response';
import { SimpleDependencyResponse } from '../dependency/simple.dependency.response';
import { SimpleRuleStore } from '../store/simple.rule.store';
import { RuleNotFoundException } from '../store/rule.store.interfafce';

describe('processExpression', () => {
    const mockRule: Rule<any> = {
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
    const simpleStore = new SimpleRuleStore(mockRule);

    it('should handle jsonata path expression', (done) => {
        const engine = new JasperEngine({ ruleStore: simpleStore });
        const processExpressionSpy = jest.spyOn(engine as any, 'processExpression');
        const context: ExecutionContext<any> = {
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
        const engine = new JasperEngine({ ruleStore: simpleStore });
        const processExpressionSpy = jest.spyOn(engine as any, 'processExpression');
        const context: ExecutionContext<any> = {
            contextId: '1',
            root: { children: [{ id: 1 }, { id: 2 }] },
            rule: mockRule,
            _process$: empty(),
            contextData: {},
            complete: false,
            response,
        };

        const ob: Observable<any[]> = (engine as any).processExpression(
            () =>
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

    it('should return [] otherwise', (done) => {
        const engine = new JasperEngine({ ruleStore: simpleStore });
        const processExpressionSpy = jest.spyOn(engine as any, 'processExpression');
        const context: ExecutionContext<any> = {
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
    const mockRule: Rule<any> = {
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

    const testStore = new SimpleRuleStore(mockRule);

    it('should handle jsonata action expression', (done) => {
        const engine = new JasperEngine({ ruleStore: testStore });
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext<any> = {
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
        const engine = new JasperEngine({ ruleStore: testStore });
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext<any> = {
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
        const engine = new JasperEngine({ ruleStore: testStore });
        const executeActionSpy = jest.spyOn(engine as any, 'executeAction');
        const context: ExecutionContext<any> = {
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

        const action = () => of(123);

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
        const engine = new JasperEngine({ ruleStore: testStore });
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
    const mockRule: Rule<any> = {
        name: 'mockRule',
        description: 'description for mock rule',
        action: () => of(1),
    };

    const testStore = new SimpleRuleStore(mockRule);

    const response = {
        rule: mockRule.name,
        hasError: false,
        isSuccessful: false,
        result: undefined,
    };

    it('should skip simple dependency if jsonata when expression evaluates to false', (done) => {
        const engine = new JasperEngine({ ruleStore: testStore });
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            when: 'children ~> $count() > 2',
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(
            simpleDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(true);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should skip simple dependency if observable when expression evaluates to false', (done) => {
        const engine = new JasperEngine({ ruleStore: testStore });
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            when: () => of(false),
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(
            simpleDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(true);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should return response with error if unable to evaluate path expression', (done) => {
        const engine = new JasperEngine({ ruleStore: testStore });
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            when: () => throwError(new Error('error evaluating when')),
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(
            simpleDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(false);
                expect(dependencyResponse.hasError).toBe(true);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should return response without error if unable to evaluate path expression but handled by onDependencyError hook', (done) => {
        const engine = new JasperEngine({ ruleStore: testStore });
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
            },
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(
            simpleDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(true);
                expect(dependencyResponse.hasError).toBe(false);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should not execute dependency rule if no object found by path expression', (done) => {
        const mockFn = jest.fn().mockReturnValue(1);
        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                mockFn();
                return of(1);
            },
        };

        const ruleStore = new SimpleRuleStore(mockRule);
        const engine = new JasperEngine({ ruleStore });
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'notfound',
            rule: mockRule.name,
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(
            simpleDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(mockFn).toBeCalledTimes(0);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should run simpleDependency hooks', (done) => {
        const mockFn = jest.fn().mockReturnValue(1);
        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                mockFn();
                return of(1);
            },
        };

        const ruleStore = new SimpleRuleStore(mockRule);
        const engine = new JasperEngine({ ruleStore });
        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const beforeEachFn = jest.fn().mockReturnValue(1);
        const afterEachFn = jest.fn().mockReturnValue(1);
        const beforeDependencyFn = jest.fn().mockReturnValue(1);
        const afterDependencyFn = jest.fn().mockReturnValue(1);

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            executionOrder: ExecutionOrder.Sequential,
            beforeDependency: () => {
                return of(beforeDependencyFn());
            },
            beforeEach: () => {
                return of(beforeEachFn());
            },
            afterEach: (pathObject, index, context) => {
                afterEachFn();
                return of(context.response);
            },
            afterDependency: () => {
                return of(afterDependencyFn());
            },
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(
            simpleDependency,
            context
        );

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
            },
        });

        subscription.unsubscribe();
    });

    it('should return response with error if failed to run dependency rule for any path object', (done) => {
        const mockFn = jest
            .fn()
            .mockReturnValueOnce(1)
            .mockImplementationOnce(() => {
                throw new Error('error');
            });

        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                mockFn();
                return of(1);
            },
        };

        const ruleStore = new SimpleRuleStore(mockRule);
        const engine = new JasperEngine({ ruleStore });

        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(
            simpleDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(false);
                expect(dependencyResponse.hasError).toBe(true);
                expect(dependencyResponse.errors).toHaveLength(1);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should return response without error if failed to run dependency rule for any path object but handled by onEachError Hook', (done) => {
        const mockFn = jest
            .fn()
            .mockReturnValueOnce(1)
            .mockImplementationOnce(() => {
                throw new Error('error');
            });

        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                mockFn();
                return of(1);
            },
        };

        const ruleStore = new SimpleRuleStore(mockRule);
        const engine = new JasperEngine({ ruleStore });

        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            onEachError: (_err, response) => {
                response.isSuccessful = true;
                response.hasError = false;
                return of(response);
            },
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(
            simpleDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(true);
                expect(dependencyResponse.hasError).toBe(false);
                expect(dependencyResponse.errors).toHaveLength(0);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should return response with error if failed to run dependency rule for any path object but not handled by onEachError Hook', (done) => {
        const mockFn = jest
            .fn()
            .mockReturnValueOnce(1)
            .mockImplementationOnce(() => {
                throw new Error('error');
            });

        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                mockFn();
                return of(1);
            },
        };

        const ruleStore = new SimpleRuleStore(mockRule);
        const engine = new JasperEngine({ ruleStore });

        const processSimpleDependencySpy = jest.spyOn(engine as any, 'processSimpleDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            onEachError: (_err, response) => {
                response.isSuccessful = true;
                response.hasError = false;
                return throwError(new Error('another error'));
            },
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<SimpleDependencyResponse> = (engine as any).processSimpleDependency(
            simpleDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processSimpleDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(false);
                expect(dependencyResponse.hasError).toBe(true);
                expect(dependencyResponse.errors).toHaveLength(1);
                done();
            },
        });

        subscription.unsubscribe();
    });
});

describe('processCompositeDependency', () => {
    const mockRule: Rule<any> = {
        name: 'mockRule',
        description: 'description for mock rule',
        action: () => of(1),
    };

    const ruleStore = new SimpleRuleStore(mockRule);

    const response = {
        rule: mockRule.name,
        hasError: false,
        isSuccessful: false,
        result: undefined,
    };

    it('should skip composite dependency if jsonata when expression evaluates to false', (done) => {
        const engine = new JasperEngine({ ruleStore });
        const processCompositeDependencySpy = jest.spyOn(engine as any, 'processCompositeDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
        };

        const compositeDependency: CompositeDependency = {
            name: 'test composite dependency',
            when: 'children ~> $count() > 2',
            rules: [simpleDependency],
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<CompositeDependencyResponse> = (engine as any).processCompositeDependency(
            compositeDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processCompositeDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(true);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should skip composite dependency if observable when expression evaluates to false', (done) => {
        const engine = new JasperEngine({ ruleStore });
        const processCompositeDependencySpy = jest.spyOn(engine as any, 'processCompositeDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
        };

        const compositeDependency: CompositeDependency = {
            name: 'test composite dependency',
            when: () => of(false),
            rules: [simpleDependency],
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<CompositeDependencyResponse> = (engine as any).processCompositeDependency(
            compositeDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processCompositeDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(true);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should return response with error if unable to evaluate path expression', (done) => {
        const engine = new JasperEngine({ ruleStore });
        const processCompositeDependencySpy = jest.spyOn(engine as any, 'processCompositeDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
        };

        const compositeDependency: CompositeDependency = {
            name: 'test composite dependency',
            when: () => throwError(new Error('when evaluation error')),
            rules: [simpleDependency],
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<CompositeDependencyResponse> = (engine as any).processCompositeDependency(
            compositeDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processCompositeDependencySpy).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(false);
                expect(dependencyResponse.hasError).toBe(true);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should run lifecycle hooks', (done) => {
        const engine = new JasperEngine({ ruleStore });
        const processCompositeDependencySpy = jest.spyOn(engine as any, 'processCompositeDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
        };

        const beforeMockFn = jest.fn().mockReturnValue(1);
        const afterMockFn = jest.fn().mockReturnValue(1);

        const compositeDependency: CompositeDependency = {
            name: 'test composite dependency',
            beforeDependency: () => of(beforeMockFn()),
            afterDependency: () => of(afterMockFn()),
            rules: [simpleDependency],
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<CompositeDependencyResponse> = (engine as any).processCompositeDependency(
            compositeDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processCompositeDependencySpy).toBeCalledTimes(1);
                expect(beforeMockFn).toBeCalledTimes(1);
                expect(afterMockFn).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(true);
                done();
            },
        });

        subscription.unsubscribe();
    });

    it('should run onDependencyError if error not handled but nested dependency', (done) => {
        const engine = new JasperEngine({ ruleStore });
        const processCompositeDependencySpy = jest.spyOn(engine as any, 'processCompositeDependency');

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
            afterDependency: () => {
                return throwError(new Error('afterDependency error'));
            },
            onDependencyError: (err) => {
                return throwError(err);
            },
        };

        const onDependencyErrorMockFn = jest.fn();
        const compositeDependency: CompositeDependency = {
            name: 'test composite dependency',
            rules: [simpleDependency],
            onDependencyError: (err, response) => {
                response.isSuccessful = false;
                response.errors.push(err);
                onDependencyErrorMockFn();
                return of(response);
            },
        };

        const context: ExecutionContext<any> = {
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

        const task: Observable<CompositeDependencyResponse> = (engine as any).processCompositeDependency(
            compositeDependency,
            context
        );

        const subscription = task.subscribe({
            next: (dependencyResponse) => {
                expect(processCompositeDependencySpy).toBeCalledTimes(1);
                expect(onDependencyErrorMockFn).toBeCalledTimes(1);
                expect(dependencyResponse.isSkipped).toBe(false);
                expect(dependencyResponse.isSuccessful).toBe(false);
                done();
            },
        });

        subscription.unsubscribe();
    });

    describe('operator OR', () => {
        it('consider composite compendency to be successful if either dependency task is successful', (done) => {
            const engine = new JasperEngine({ ruleStore });
            const processCompositeDependencySpy = jest.spyOn(engine as any, 'processCompositeDependency');

            const simpleDependency: SimpleDependency = {
                name: 'test simple dependency',
                path: 'children',
                rule: mockRule.name,
                afterDependency: () => {
                    return throwError(new Error('afterDependency error'));
                },
                onDependencyError: (err) => {
                    return throwError(err);
                },
            };

            const nestCompositeDependency: CompositeDependency = {
                name: 'test composite dependency',
                rules: [simpleDependency],
            };

            const simpleDependency2: SimpleDependency = {
                name: 'test simple dependency 2',
                path: 'children',
                rule: mockRule.name,
            };

            const compositeDependency: CompositeDependency = {
                name: 'test composite dependency',
                operator: Operator.OR,
                rules: [nestCompositeDependency, simpleDependency2],
            };

            const context: ExecutionContext<any> = {
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

            const task: Observable<CompositeDependencyResponse> = (engine as any).processCompositeDependency(
                compositeDependency,
                context
            );

            const subscription = task.subscribe({
                next: (dependencyResponse) => {
                    expect(processCompositeDependencySpy).toBeCalledTimes(2);
                    expect(dependencyResponse.isSuccessful).toBe(true);
                    const nestedCompositeDependencyResponse = _.find(
                        dependencyResponse.rules,
                        (r) => r.name === nestCompositeDependency.name
                    );
                    const nestedSimpleDependencyResponse = _.find(
                        dependencyResponse.rules,
                        (r) => r.name === simpleDependency2.name
                    );
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    expect(nestedCompositeDependencyResponse!.isSuccessful).toBe(false);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    expect(nestedSimpleDependencyResponse!.isSuccessful).toBe(true);
                    done();
                },
            });

            subscription.unsubscribe();
        });

        it('consider composite compendency to be unsuccessful if all dependency tasks are unsuccessful', (done) => {
            const engine = new JasperEngine({ ruleStore });
            const processCompositeDependencySpy = jest.spyOn(engine as any, 'processCompositeDependency');

            const simpleDependency: SimpleDependency = {
                name: 'test simple dependency',
                path: 'children',
                rule: mockRule.name,
                afterDependency: () => {
                    return throwError(new Error('afterDependency error'));
                },
            };

            const nestCompositeDependency: CompositeDependency = {
                name: 'test composite dependency',
                rules: [simpleDependency],
            };

            const simpleDependency2: SimpleDependency = {
                name: 'test simple dependency 2',
                path: 'children',
                rule: mockRule.name,
                afterDependency: () => {
                    return throwError(new Error('afterDependency error'));
                },
            };

            const compositeDependency: CompositeDependency = {
                name: 'test composite dependency',
                operator: Operator.OR,
                rules: [nestCompositeDependency, simpleDependency2],
            };

            const context: ExecutionContext<any> = {
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

            const task: Observable<CompositeDependencyResponse> = (engine as any).processCompositeDependency(
                compositeDependency,
                context
            );

            const subscription = task.subscribe({
                next: (dependencyResponse) => {
                    expect(processCompositeDependencySpy).toBeCalledTimes(2);
                    expect(dependencyResponse.isSuccessful).toBe(false);
                    const nestedCompositeDependencyResponse = _.find(
                        dependencyResponse.rules,
                        (r) => r.name === nestCompositeDependency.name
                    );
                    const nestedSimpleDependencyResponse = _.find(
                        dependencyResponse.rules,
                        (r) => r.name === simpleDependency2.name
                    );
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    expect(nestedCompositeDependencyResponse!.isSuccessful).toBe(false);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    expect(nestedSimpleDependencyResponse!.isSuccessful).toBe(false);
                    done();
                },
            });

            subscription.unsubscribe();
        });
    });

    describe('operator AND', () => {
        it('consider composite compendency to be successful if all dependency tasks are successful', (done) => {
            const engine = new JasperEngine({ ruleStore });
            const processCompositeDependencySpy = jest.spyOn(engine as any, 'processCompositeDependency');

            const simpleDependency: SimpleDependency = {
                name: 'test simple dependency',
                path: 'children',
                rule: mockRule.name,
            };

            const nestCompositeDependency: CompositeDependency = {
                name: 'test composite dependency',
                rules: [simpleDependency],
            };

            const simpleDependency2: SimpleDependency = {
                name: 'test simple dependency 2',
                path: 'children',
                rule: mockRule.name,
            };

            const compositeDependency: CompositeDependency = {
                name: 'test composite dependency',
                operator: Operator.AND,
                rules: [nestCompositeDependency, simpleDependency2],
            };

            const context: ExecutionContext<any> = {
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

            const task: Observable<CompositeDependencyResponse> = (engine as any).processCompositeDependency(
                compositeDependency,
                context
            );

            const subscription = task.subscribe({
                next: (dependencyResponse) => {
                    expect(processCompositeDependencySpy).toBeCalledTimes(2);
                    expect(dependencyResponse.isSuccessful).toBe(true);
                    const nestedCompositeDependencyResponse = _.find(
                        dependencyResponse.rules,
                        (r) => r.name === nestCompositeDependency.name
                    );
                    const nestedSimpleDependencyResponse = _.find(
                        dependencyResponse.rules,
                        (r) => r.name === simpleDependency2.name
                    );
                    expect(nestedCompositeDependencyResponse!.isSuccessful).toBe(true);
                    expect(nestedSimpleDependencyResponse!.isSuccessful).toBe(true);
                    done();
                },
            });

            subscription.unsubscribe();
        });

        it('consider composite compendency to be unsuccessful if either dependency task is unsuccessful', (done) => {
            const engine = new JasperEngine({ ruleStore });
            const processCompositeDependencySpy = jest.spyOn(engine as any, 'processCompositeDependency');

            const simpleDependency: SimpleDependency = {
                name: 'test simple dependency',
                path: 'children',
                rule: mockRule.name,
                afterDependency: () => {
                    return throwError(new Error('afterDependency error'));
                },
            };

            const nestCompositeDependency: CompositeDependency = {
                name: 'test composite dependency',
                rules: [simpleDependency],
            };

            const simpleDependency2: SimpleDependency = {
                name: 'test simple dependency 2',
                path: 'children',
                rule: mockRule.name,
            };

            const compositeDependency: CompositeDependency = {
                name: 'test composite dependency',
                operator: Operator.AND,
                executionOrder: ExecutionOrder.Sequential,
                rules: [nestCompositeDependency, simpleDependency2],
            };

            const context: ExecutionContext<any> = {
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

            const task: Observable<CompositeDependencyResponse> = (engine as any).processCompositeDependency(
                compositeDependency,
                context
            );

            const subscription = task.subscribe({
                next: (dependencyResponse) => {
                    expect(processCompositeDependencySpy).toBeCalledTimes(2);
                    expect(dependencyResponse.isSuccessful).toBe(false);
                    const nestedCompositeDependencyResponse = _.find(
                        dependencyResponse.rules,
                        (r) => r.name === nestCompositeDependency.name
                    );
                    const nestedSimpleDependencyResponse = _.find(
                        dependencyResponse.rules,
                        (r) => r.name === simpleDependency2.name
                    );
                    expect(nestedCompositeDependencyResponse!.isSuccessful).toBe(false);
                    expect(nestedSimpleDependencyResponse!.isSuccessful).toBe(true);
                    done();
                },
            });

            subscription.unsubscribe();
        });
    });
});

describe('execute', () => {
    it('should return failure if rule not found', (done) => {
        const rule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
        };

        const store = new SimpleRuleStore(rule);

        const engine = new JasperEngine({ ruleStore: store });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        const notfoundrule = 'notfound-rule';
        (engine as any).execute({ root, ruleName: notfoundrule }).subscribe({
            next: (response: ExecutionResponse) => {
                const error = new RuleNotFoundException(notfoundrule);
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.hasError).toBe(true);
                expect(response.result).toBe(undefined);
                expect(response.isSuccessful).toBe(false);
                expect(response.error).toMatchObject(error);

                done();
            },
        });
    });

    it('should return failure if unable to get rule', (done) => {
        const error = new Error('unable to get rule');
        const store = {
            get(): Observable<Rule<any>> {
                return new Observable((subscriber) => {
                    setTimeout(() => {
                        subscriber.error(error);
                    }, 800);
                });
            },
        };

        const engine = new JasperEngine({ ruleStore: store });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        const notfoundrule = 'notfound-rule';
        (engine as any).execute({ root, ruleName: notfoundrule }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.hasError).toBe(true);
                expect(response.result).toBe(undefined);
                expect(response.isSuccessful).toBe(false);
                expect(response.error).toMatchObject(error);

                done();
            },
        });
    });

    it('should invoke beforeAction hook', (done) => {
        const beforeActionMock = jest.fn().mockReturnValue(1);
        const actionMock = jest.fn().mockReturnValue(1);

        const rule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            beforeAction: () => {
                return of(beforeActionMock());
            },
            action: () => {
                return of(actionMock());
            },
        };

        const store = new SimpleRuleStore(rule);

        const engine = new JasperEngine({ ruleStore: store });

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

        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            afterAction: (context) => {
                return of(context.response).pipe(
                    tap(() => {
                        afterActionMock();
                    })
                );
            },
            action: () => {
                return of(actionMock());
            },
        };

        const ruleStore = new SimpleRuleStore(mockRule);

        const engine = new JasperEngine({
            ruleStore,
            options: {
                recipe: EngineRecipe.ValidationRuleEngine,
                suppressDuplicateTasks: true,
                debug: true,
            },
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        const context: ExecutionContext<any> = {
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
            response: {
                rule: mockRule.name,
                hasError: false,
                isSuccessful: false,
                result: undefined,
            },
        };

        (engine as any).execute({ root, ruleName: mockRule.name, parentExecutionContext: context }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(afterActionMock).toBeCalledTimes(1);
                expect(actionMock).toBeCalledTimes(1);
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.result).toBe(1);

                done();
            },
        });
    });

    it('should return true by default if action is not provided for Validation recipe', (done) => {
        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
        };

        const ruleStore = new SimpleRuleStore(mockRule);
        const engine = new JasperEngine({
            ruleStore,
            options: {
                recipe: EngineRecipe.ValidationRuleEngine,
                suppressDuplicateTasks: true,
            },
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        const context: ExecutionContext<any> = {
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
            response: {
                rule: mockRule.name,
                hasError: false,
                isSuccessful: false,
                result: undefined,
            },
        };

        (engine as any).execute({ root, ruleName: mockRule.name, parentExecutionContext: context }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.result).toBe(true);
                expect(response.isSuccessful).toBe(true);
                done();
            },
        });
    });

    it('should return null by default if action is not provided for BusinessProcess recipe', (done) => {
        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
        };

        const ruleStore = new SimpleRuleStore(mockRule);
        const engine = new JasperEngine({
            ruleStore,
            options: {
                recipe: EngineRecipe.BusinessProcessEngine,
                suppressDuplicateTasks: true,
            },
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        const context: ExecutionContext<any> = {
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
            response: {
                rule: mockRule.name,
                hasError: false,
                isSuccessful: false,
                result: undefined,
            },
        };

        (engine as any).execute({ root, ruleName: mockRule.name, parentExecutionContext: context }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(executeSpy).toBeCalledTimes(1);
                expect(response.result).toBe(null);
                expect(response.isSuccessful).toBe(true);
                done();
            },
        });
    });

    it('should invoke onError hook and throw error if stream not replaced', (done) => {
        const actionMock = jest.fn().mockReturnValue(1);
        const errorMock = jest.fn();
        const rule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                actionMock();
                return throwError(new Error('exception'));
            },
            onError: (err) => {
                errorMock();
                return throwError(err);
            },
        };

        const store = new SimpleRuleStore(rule);
        const engine = new JasperEngine({ ruleStore: store });

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
            },
        });
    });

    it('should invoke onError hook and replace the stream with what is provided', (done) => {
        const actionMock = jest.fn().mockReturnValue(1);
        const errorMock = jest.fn();
        const rule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                actionMock();
                return throwError(new Error('exception'));
            },
            onError: (_err, context) => {
                errorMock();
                context.response.result = 'replaced';
                return of(null);
            },
        };

        const store = new SimpleRuleStore(rule);
        const engine = new JasperEngine({ ruleStore: store });

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
            },
        });
    });

    it('should invoke onError hook (jsonata expression) and replace the error with what is returned', (done) => {
        const actionMock = jest.fn().mockReturnValue(1);
        const rule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                actionMock();
                return throwError(new Error('exception'));
            },
            onError: 'children.text ~> $join(", ")',
        };

        const store = new SimpleRuleStore(rule);
        const engine = new JasperEngine({ ruleStore: store });

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
                expect(response.error).toBe('child1, child2');
                expect(response.hasError).toBe(true);
                expect(response.isSuccessful).toBe(false);
                done();
            },
        });
    });

    it('should invoke onError hook (jsonata expression) and try error if expression has issue', (done) => {
        const actionMock = jest.fn().mockReturnValue(1);
        const rule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                actionMock();
                return throwError(new Error('exception'));
            },
            onError: '[',
        };

        const store = new SimpleRuleStore(rule);
        const engine = new JasperEngine({ ruleStore: store });

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
                expect(response.error).toMatchObject({ message: 'Expected "]" before end of expression' });
                expect(response.hasError).toBe(true);
                expect(response.isSuccessful).toBe(false);
                done();
            },
        });
    });

    it('should share/multicast the action if option is set to suppress duplicate tasks', (done) => {
        const actionMock = jest.fn().mockReturnValue(1);

        const rule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                return of(actionMock());
            },
        };
        const ruleStore = new SimpleRuleStore(rule);
        const engine = new JasperEngine({
            ruleStore,
            options: {
                recipe: EngineRecipe.BusinessProcessEngine,
                suppressDuplicateTasks: true,
            },
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

        const rule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                return of(actionMock());
            },
        };

        const ruleStore = new SimpleRuleStore(rule);
        const engine = new JasperEngine({
            ruleStore,
            options: {
                recipe: EngineRecipe.ValidationRuleEngine,
                suppressDuplicateTasks: false,
            },
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

    it('should process rule with dependency', (done) => {
        const actionMock = jest.fn().mockReturnValue(1);

        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            action: () => {
                return of(actionMock());
            },
        };

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
        };

        const compositeDependency: CompositeDependency = {
            name: 'test composite dependency',
            rules: [simpleDependency],
        };

        const parentRule: Rule<any> = {
            name: 'parentRule',
            description: 'description for mock rule',
            action: () => {
                return of(actionMock());
            },
            dependencies: compositeDependency,
        };

        const store = new SimpleRuleStore(mockRule, parentRule);
        const engine = new JasperEngine({ ruleStore: store });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child2' },
            ],
        };

        (engine as any).execute({ root, ruleName: parentRule.name }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(actionMock).toBeCalledTimes(3);
                expect(executeSpy).toBeCalledTimes(3);
                expect(response.result).toBe(1);
                expect(response.isSuccessful).toBe(true);
                expect(response!.dependency!.isSuccessful).toBe(true);
                expect(response!.dependency!.rules[0]!.isSuccessful).toBe(true);
                done();
            },
        });
    });

    it('should respect custom uniqueBy when determining object uniqueness', (done) => {
        const actionMock2 = jest.fn().mockReturnValue(1);

        const mockRule: Rule<any> = {
            name: 'mockRule',
            description: 'description for mock rule',
            uniqueBy: (root) => ({ name: root.name }),
            action: () => {
                return of(actionMock2());
            },
        };

        const simpleDependency: SimpleDependency = {
            name: 'test simple dependency',
            path: 'children',
            rule: mockRule.name,
        };

        const compositeDependency: CompositeDependency = {
            name: 'test composite dependency',
            rules: [simpleDependency],
        };

        const actionMock = jest.fn().mockReturnValue(1);
        const parentRule: Rule<any> = {
            name: 'parentRule',
            description: 'description for mock rule',
            action: () => {
                return of(actionMock());
            },
            dependencies: compositeDependency,
        };

        const ruleStore = new SimpleRuleStore(mockRule, parentRule);
        const engine = new JasperEngine({
            ruleStore,
            options: {
                recipe: EngineRecipe.BusinessProcessEngine,
                suppressDuplicateTasks: true,
            },
        });

        const executeSpy = jest.spyOn(engine as any, 'execute');

        const root = {
            children: [
                { id: 1, text: 'child1' },
                { id: 2, text: 'child1' },
            ],
        };

        (engine as any).execute({ root, ruleName: parentRule.name }).subscribe({
            next: (response: ExecutionResponse) => {
                expect(actionMock).toBeCalledTimes(1);
                expect(actionMock2).toBeCalledTimes(1);
                expect(executeSpy).toBeCalledTimes(3);
                expect(response.result).toBe(1);
                expect(response.isSuccessful).toBe(true);
                expect(response!.dependency!.isSuccessful).toBe(true);
                expect(response!.dependency!.rules[0]!.isSuccessful).toBe(true);
                done();
            },
        });
    });
});
