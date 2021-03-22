- [1. Description](#1-description)
  - [Jasper Rule Engine](#jasper-rule-engine)
- [2. Quickstart](#2-quickstart)
- [3. Rule](#3-rule)
- [4. Dependencies](#4-dependencies)
  - [Simple Dependency](#simple-dependency)
  - [Composite Dependency](#composite-dependency)
  - [ExecutionOrder](#executionorder)
  - [Operator](#operator)
- [5. Recipe](#5-recipe)
  - [Process Engine](#process-engine)
  - [Validation Engine](#validation-engine)
- [6. Lifecycle Hooks](#6-lifecycle-hooks)
  - [For Rule](#for-rule)
  - [For Simple Dependency](#for-simple-dependency)
  - [For Compositive Dependency](#for-compositive-dependency)
- [7. Execution Context](#7-execution-context)


# 1. Description
  ## Jasper Rule Engine
  Are you building an application that contains a lot of validation rules ?   
  Are you building an application that contains a lot of business workflow process ?   
  
  Here comes Jasper Rule Engine.

# 2. Quickstart
      To get started  
      npm install --save jasper-engine rxjs jsonata

```typescript
import { Rule, JasperEngine, SimpleRuleStore, Operator, ExecutionOrder } from 'jasper-engine';
/*
  Define your rules
*/
const isJasper: Rule = {
    // the name of the rule
    name: 'isJasper',
    // a description for your rule. (documentation purpose only)
    description: 'a rule to check if the dog is named Jasper',
    // a jsonata expression to test if rule is true/false
    action: 'name = "Jasper"',
};

const isSamoyed: Rule = {
    name: 'isSamoyed',
    description: 'a rule to check if the dog is of breed samoyed',
    action: 'breed = "Samoyed"',
};

const isMyDog: Rule = {
    name: 'isMyDog',
    description: 'a rule to check if the dog is my dog',
    dependencies: {
        name: 'my dog is a samoyed named Jasper',
        operator: Operator.AND,
        executionOrder: ExecutionOrder.Parallel,
        rules: [
            {
                name: 'name should be jasper',
                path: '$',
                rule: isJasper.name,
            },
            {
                name: 'breed should be samoyed',
                path: '$',
                rule: isSamoyed.name,
            },
        ],
    },
};

/*
  compile your rules
*/
const ruleStore = new SimpleRuleStore(isJasper, isSamoyed, isMyDog);

/*
* execute to figure out if the dog is Jasper.
*/
const engine = new JasperEngine({ ruleStore });
const dog = {
    name: 'Jasper',
    breed: 'Samoyed',
};

engine
    .run({
        root: dog,
        ruleName: 'isMyDog',
    })
    .subscribe({
        next: (response) => {
            //expect(response.isSuccessful).toBe(true);
        },
    });

```

# 3. Rule


# 4. Dependencies
## Simple Dependency

## Composite Dependency

## ExecutionOrder

## Operator

# 5. Recipe
## Process Engine
## Validation Engine

# 6. Lifecycle Hooks
## For Rule
* beforeAction
* afterAction
* onError

## For Simple Dependency
* beforeDependency
* beforeEach
* afterEach
* onEachError
* afterDependency
* onDependencyError

## For Compositive Dependency
* beforeDependency
* afterDependency
* onDependencyError

# 7. Execution Context

