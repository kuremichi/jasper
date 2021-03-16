"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticRuleStore = void 0;
const rule_config_1 = require("../src/rule.config");
const rxjs_1 = require("rxjs");
const lodash_1 = __importDefault(require("lodash"));
const operators_1 = require("rxjs/operators");
const store = [
    {
        name: 'test rule 1',
        description: '',
        beforeAction: () => {
            console.log('preprocessing rule 1');
        },
        action: async () => {
            // console.log('processing rule 1')
            // return 'processing rule 1'
            throw 'error rule 1';
        },
    },
    {
        name: 'test rule 2',
        description: '',
        beforeAction: () => {
            console.log('preprocessing rule 2');
        },
        action: rxjs_1.of('result for rule 2').pipe(operators_1.delay(3000)),
    },
    {
        name: 'test rule 3',
        description: '',
        beforeAction: async () => {
            console.log('preprocessing rule 3');
        },
        action: rxjs_1.of('processing 3').pipe(operators_1.tap(() => console.log('processing rule 3'))),
        dependencies: {
            name: 'dependencies of rule 3',
            rules: [
                {
                    name: 'dependency rule 3 - 1',
                    path: 'packages',
                    rule: 'test rule 1',
                },
                {
                    name: 'dependency rule 3 - 2',
                    executionOrder: rule_config_1.ExecutionOrder.Sequential,
                    operator: rule_config_1.Operator.AND,
                    rules: [
                        {
                            name: 'dependency rule 3 - 2 - 1',
                            path: 'packages',
                            rule: 'test rule 2',
                        },
                        {
                            name: 'dependency rule 3 - 2 - 2',
                            path: '$',
                            rule: 'test rule 4',
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
    },
];
exports.StaticRuleStore = lodash_1.default.reduce(store, (acc, rule) => {
    acc[rule.name] = rule;
    return acc;
}, {});
//# sourceMappingURL=test.sequential.store.js.map