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
      npm install --save @kuremichi/jasper

      Also, you might want to install rxjs as Jasper Rule Engine heavily depends on Observable  
      to configure its rule.
      npm install --save rxjs

```typescript
import { EngineRecipe, JasperEngine, Rule, SimpleRuleStore } from "@kuremichi/jasper";
import { iif, of } from "rxjs";

interface Person {
    age: number;
    name: string;
    currentLocation: {
        country: string;
        stateOrProvince: string;
    }
}

const _21YoRule: Rule<Person> = {
    name: 'can buy alcohol at the age of 21+',
    description: 'check if a person has reached the legal age to buy an alcohol',
    action: 'age >= 21'
}

const _18YoRule: Rule<Person> = {
    name: 'can buy alcohol at the age of 18+',
    description: 'check if a person has reached the legal age to buy an alcohol',
    action: 'age >= 18'
}

const _19YoRule: Rule<Person> = {
    name: 'can buy alcohol at the age of 19+',
    description: 'check if a person has reached the legal age to buy an alcohol',
    action: 'age >= 19'
}

const canadaAlcoholRule: Rule<Person> = {
    name: 'can buy alcohol in Canada',
    description: 'check if a person has reached the legal age to buy an alcohol in Canada',
    dependencies: {
        name: '',
        rules: [
            {
                name: 'Quebec, Manitoba, Alberta',
                rule: _18YoRule.name,
                path: '$',
                // if string is provided, it will be evaluated using jsonata
                // https://try.jsonata.org/
                when: 'currentLocation.stateOrProvince in ["QC", "MB", "AB"]',
            },
            {
                name: 'Quebec, Manitoba, Alberta',
                rule: _19YoRule.name,
                path: '$',
                // otherwise, it takes a function that will return an Observable<boolean>
                when: (context) => 
                    iif(
                        () => ['QC', 'MB', 'AB'].indexOf(context.root.currentLocation.stateOrProvince) === -1,
                        of(true),
                        of(false),
                    ),
            }
        ]
    }
}

const alcoholRule: Rule<Person> = {
    name: 'can buy alcohol',
    description: 'check if a person has reached the legal age to buy an alcohol in the current location',
    dependencies: {
        name: 'alcohol rule world wide',
        rules: [
            {
                name: 'US Alcohol Rule',
                rule: _21YoRule.name,
                path: '$',
                when: 'currentLocation.country = "United States"',
            },
            {
                name: 'Canada Alcohol Rule',
                rule: canadaAlcoholRule.name,
                path: '$',
                when: 'currentLocation.country = "Canada"',
            }
            // rules for other countries omitted
        ]
    }
}

const ruleStore = new SimpleRuleStore(_18YoRule, _19YoRule, _21YoRule, alcoholRule, canadaAlcoholRule);
const engine = new JasperEngine({
    ruleStore,
    options: {
        recipe: EngineRecipe.ValidationRuleEngine,
    },
    logger: console,
});

const person: Person = {
    age: 18,
    name: 'Dave',
    currentLocation: {
        country: 'Canada',
        stateOrProvince: 'AB',
    }
}

engine
    .run({
        root: person,
        ruleName: alcoholRule.name,
    })
    .subscribe((response) => {
        // true for AB, Canada, false for BC, Canada
        // false for WA, US
        console.log(`${person.name} can${response.isSuccessful ? '' : 'not'} buy alcohol in ${person.currentLocation.stateOrProvince}, ${person.currentLocation.country}`);
    });



```

# 3. Rule
A rule is a simple piece of logic.  
It could be a validation logic, a workflow process, a http request.  

A simple rule could look like below.
```typescript

const validateCreditCard: rule


```

# 4. Dependencies
### Simple Dependency
A simple dependency is a dependency on a particular rule. The rule that is depended on could have its own dependencies (and then nested dependencies). That being said, a simple dependency is only simple in the sense of its configuration syntax.

### Composite Dependency
As the name suggests, a composite dependency is a dependency on one or more rules. A composite dependency could depend on Simple Dependencies and/or Composite Dependencies.

### ExecutionOrder
When it comes to execute dependency tasks. Jasper Engine supports two Execution, Parallel and Sequential.  
* For Composite Dependency, this means each dependency configured in the rules array will be executed in parallel or in order.
* For Simple Dependency, this means the results (an array) returned by the **Path** expression will be executed in parallel or in order.

The default is **Parallel**.

### Operator
When determining if the dependency execution is successful, you can specify **AND** or **OR**. 

|  Type   | AND  | OR   |
| ------- | ---- | ---- |
| Composite Dependency | all dependencies defined under rules have to be successful. | at least one dependency defined under rules needs to be successful. |
| Simple Dependency    | executions against all object returned by **PATH** need to successful | Not Supported |


The default is **AND**.

# 5. Recipe

Jasper Engine provides two modes where you can specify the time of instantiating the engine. They are in general very similar with some small differences.

* Process Engine  
    Process Engine consider a rule execution to be successful when the rule action does not throw an exception. It does not care about the result returned by the action.

* Validation Engine  
    Validation Engine consider a rule execution to be successful when the rule action does not throw an exception AND the result returned by the action has to equal to boolean value true

The default is Process Engine.

# 6. Lifecycle Hooks

Jasper engine provides many extension points during the rule and dependency execution cycle.

## For Rule

|  Hook   | Description  | 
| ------- | ---- | 
| beforeAction&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | task to run before the rule action starts. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |
| afterAction | task to run after the rule action starts. |
| onError | task to run when error occurs |

The sequence is  
1. beforeAction 
2. action
3. dependency
4. afterAction
5. onError(if not caught before)

## For Simple Dependency

|  Hook   | Description  | 
| ------- | ---- | 
| beforeDependency | task to run before the execution of the simple dependency starts. |
| beforeEach | task to run before the execution for each of the path object starts. |
| afterEach | task to run after the execution for each of the path object end. |
| onEachError | task to run when error occur for each of the path object execution. |
| afterDependency | task to run after all path objects have completed execution. |
| onDependencyError | task to run before the dependency rule fail and not caught. |

The sequence is
1. WhenExpress (default true)
2. beforeDependency
3. PathExpression
4. execute rule against each object returned by PathExpression
   1. beforeEach
   2. ruleExecution
   3. afterEach
   4. onEachError
5. afterDependency
6. onDependencyError (if not caught before)

## For Compositive Dependency

|  Hook   | Description  |
| ------- | ---- |
| beforeDependency | task to run before the composite dependency starts. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|
| afterDependency | task to run after the composite dependency end. |
| onDependencyError | task to run when error occurs |

The sequence is  
1. beforeDependency 
2. afterDependency
3. onDependencyError

# 7. Execution Context


