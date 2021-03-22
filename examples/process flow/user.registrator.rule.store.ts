import { Observable, of } from 'rxjs';
import _ from 'lodash';
import { tap, switchMap } from 'rxjs/operators';
import { Rule } from '../../src/rule';
import { ExecutionContext } from '../../src/execution.context';

export const rules: Rule[] = [
    {
        name: 'send email',
        description: 'send an email to the user',
        action: (context: ExecutionContext) =>
            new Observable((subsriber) => {
                console.log(`[${context.contextId}] sending email for....`);
                // email body
                console.log(context.root);
                setTimeout(() => {
                    console.log(`[${context.contextId}] email sent!`);
                    subsriber.next();
                    subsriber.complete();
                }, Math.random() * 1000);
            }),
    },
    {
        name: 'create an account',
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
                    console.log(`[${context.contextId}] an account for user ${user.name} has been created`);
                }),
            ),
        dependencies: {
            name: 'finishing user registration',
            rules: [
                {
                    name: 'welcome user',
                    path: (context: ExecutionContext) => {
                        return of(context.root).pipe(
                            switchMap((userObject) => {
                                return of(`
                                    <html>
                                        <body>
                                            <p>Hi ${userObject.name}! Welcome to Jasper Rule Engine!</p>
                                        </body>
                                    </html>
                                `, `
                                    <html>
                                        <body>
                                            <p>Hi ${userObject.name} 2 time! Welcome to Jasper Rule Engine!</p>
                                        </body>
                                    </html>
                                `, `
                                    <html>
                                        <body>
                                            <p>Hi ${userObject.name} 3 time! Welcome to Jasper Rule Engine!</p>
                                        </body>
                                    </html>
                                `, `
                                    <html>
                                        <body>
                                            <p>Hi ${userObject.name} 4 time! Welcome to Jasper Rule Engine!</p>
                                        </body>
                                    </html>
                                `,);
                            })
                        );
                    },
                    beforeDependency: (context) => of(context.contextId).pipe(
                        tap((contextId) => {
                            console.log(`[${contextId}] before welcome user`);
                        }),
                    ),
                    beforeEach: (_userObject: any, index: number, context: ExecutionContext) => of(context.contextId).pipe(
                        tap((contextId) => {
                            console.log(`[${contextId}] before sending ${index+1} email`);
                        }),
                    ),
                    rule: 'send email',
                    afterEach: (_userObject: any, index: number, context: ExecutionContext) => of(context.contextId).pipe(
                        tap((contextId) => {
                            console.log(`[${contextId}] after sending ${index+1} email`);
                        }),
                    ),
                    afterDependency: (context) => of(context.contextId).pipe(
                        tap((contextId) => {
                            console.log(`[${contextId}] after welcome user`);
                        }),
                    ),
                },
            ],
        },
    },
];