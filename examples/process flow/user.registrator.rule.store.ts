import { Observable, of } from 'rxjs';
import _ from 'lodash';
import { tap, switchMap } from 'rxjs/operators';
import { JasperRule } from '../../src/jasper.rule';
import { ExecutionContext } from '../../src/execution.context';

const store: JasperRule[] = [
    {
        name: 'send email',
        description: 'send an email to the user',
        action: (context: ExecutionContext) =>
            new Observable((subsriber) => {
                console.log(`[${context.contextId}] sending email....`);
                // email body
                console.log(context.root);
                setTimeout(() => {
                    console.log(`[${context.contextId}] email sent!`);
                    subsriber.next();
                    subsriber.complete();
                }, 3000);
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
                    console.log(`an account for user ${user.name} has been created`);
                }),
            ),
        dependencies: {
            name: 'finishing user registration',
            rules: [
                {
                    name: 'welcome user',
                    path: (context: ExecutionContext) =>
                        of(context.root).pipe(
                            switchMap((userObject) => {
                                return of(`
                                <html>
                                    <body>
                                        <p>Hi ${userObject.name}! Welcome to Jasper Rule Engine!</p>
                                    </body>
                                </html>
                            `);
                            })
                        ),
                    beforeDependency: (context) => of(context.contextId).pipe(
                        tap((contextId) => {
                            console.log(`[${contextId}] before welcome user`);
                        }),
                    ),
                    rule: 'send email',
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

export const StaticRuleStore = _.reduce(
    store,
    (acc: any, rule) => {
        acc[rule.name] = rule;
        return acc;
    },
    {}
);
