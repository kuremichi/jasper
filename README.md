- [1. Description](#1-description)
- [2. Quickstart](#2-quickstart)
- [3. Rule](#3-rule)
    - [Direction](#direction)
- [4. Dependencies](#4-dependencies)
    - [Simple Dependency](#simple-dependency)
    - [Composite Dependency](#composite-dependency)
    - [ExecutionOrder](#executionorder)
      - [Concurrency](#concurrency)
    - [Operator](#operator)
- [5. Recipe](#5-recipe)
- [6. Lifecycle Hooks](#6-lifecycle-hooks)
  - [For Rule](#for-rule)
  - [For Simple Dependency](#for-simple-dependency)
  - [For Composite Dependency](#for-composite-dependency)
- [7. Execution Context](#7-execution-context)


# 1. Description
  Are you building an application that contains a lot of validation rules ?   
  Are you building an application that contains a lot of business workflow process ?   
  
  Here comes Jasper Rule Engine.

# 2. Quickstart
    To get started  
    npm install --save @kuremichi/jasper rxjs

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

// create a store that knows about your rules
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
        // true for AB, Canada
        // false for BC, Canada
        // false for WA, US
        console.log(`${person.name} can${response.isSuccessful ? '' : 'not'} buy alcohol in ${person.currentLocation.stateOrProvince}, ${person.currentLocation.country}`);
    });



```

# 3. Rule
A [rule](https://kuremichi.github.io/jasper/interfaces/rule.html) is a unit of work.
It could be a validation logic, a workflow process, a http request.  
It could also be a more complicated logic that is built on top of other unit of work (dependencies)

For example, the logic to check if a VISA card is valid is a unit of work. The logic to process an order is also a unit of work that has a dependnecy on the credit card validation.

The rule is an generic interface of type T, where T represents the type of data this rule is supposed to process. For intellisense, this tells typescript that context.root should be of type T and you can get the type support when writting method in action and other hooks (see later sections). If you don't care about the type, just provide any, i.e. Rule\<any\>.

### Direction
Rule supports two [directions](https://kuremichi.github.io/jasper/enums/direction.html). OutsideIn (default) and InsideOut  
The difference is the order that dependency and rule action will be executed.  
<br/>
OutsideIn: Run rule first before running its dependencies  
Before Action -> Action -> Dependency -> After Action  
<br/>
InsideOut: Run dependencies first before running the rule  
Before Action -> Dependency -> Action -> After Action

Below is an example for two simple rules and a rule with dependencies. 

```typescript

const validateVisaCreditCard: Rule<YourClassOrInterfaceForPayment> {
    name: 'is Visa card valid',
    description: 'check if a credit card is a valid Visa card',
    action: (context) => {
        // some basic validation before we send it to Visa for payment processing
        const isValid = context.root.cardNumber 
                    && context.root.cardNumber.length === 16
                    && context.root.cvv && 
                    && context.root.cvv.length === 3;

        return of(isValid);
    }
}

const validateAmexCreditCard: Rule<YourClassOrInterfaceForPayment> {
    name: 'is American Express card valid',
    description: 'check if a credit card is a valid American Express card',
    action: (context) => {
        // some basic validation before we send it to Amex for payment processing
        const isValid = context.root.cardNumber 
                    && context.root.cardNumber.length === 16
                    && context.root.cvv && 
                    && context.root.cvv.length === 4;

        return of(isValid);
    }
}

const isValidCreditCard: Rule<YourClassOrInterfaceForPayment> {
    name: 'is credit card valid',
    description: 'check if a credit card is a valid',
    dependencies: {
        name: 'Validate Credit Card Based on issuer',
        rules: [
            {
                name: 'validate visa',
                path: '$',
                rule: validateVisaCreditCard.name,
                when: 'paymentType = "Visa"'
            },
            {
                name: 'validate amex',
                path: '$',
                rule: validateAmexCreditCard.name,
                when: 'paymentType = "Amex"'
            },
        ]
    }
}


```

# 4. Dependencies
### Simple Dependency
A [simple dependency](https://kuremichi.github.io/jasper/interfaces/simpledependency.html) is a dependency on a particular rule. The rule that is depended on could have its own dependencies (and then nested dependencies). That being said, a simple dependency is only simple in the sense of its configuration syntax.

### Composite Dependency
As the name suggests, a [composite dependency](https://kuremichi.github.io/jasper/interfaces/compositedependency.html) is a dependency on one or more rules. A composite dependency could depend on Simple Dependencies and/or Composite Dependencies.  
When specifying the dependencies for composite dependency, if the execution of the dependency is conditional, you could provide a **when** expresion. As you can tell from the alcohol rule example above, you can either provide an expression in string or a method that will return an Observable<boolean>. When a dependency is skipped, it will be deemed as successful.

### ExecutionOrder
When it comes to execute dependency tasks. Jasper Engine supports two Execution, Parallel and Sequential.  
* For Composite Dependency, this means each dependency configured in the rules array will be executed in parallel or in order.
* For Simple Dependency, this means the results (an array) returned by the **Path** expression will be executed in parallel or in order.

#### Concurrency  
When executing a dependency **in parallel**, you might want to limit the number of dependencies to be executed at the same time. You can do so by specifying the maxConcurrency on the dependency config.


|  Type   | Note  |
| ------- | ---- |
| Composite Dependency | all dependencies defined will be executed in parallel but not more than **N** at a time. |
| Simple Dependency    | executions against all object returned by **PATH** will be executed in parallel but not more than **N** at a time. |

** N is the value set for maxConcurrency.

### Operator
When determining if the dependency execution is successful, you can specify **AND** or **OR**. 

|  Type   | AND  | OR   |
| ------- | ---- | ---- |
| Composite Dependency | all dependencies defined under rules have to be successful. | at least one dependency defined under rules needs to be successful. |
| Simple Dependency    | executions against all object returned by **PATH** need to successful | At least one execution agaist the pathObject is successful |


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
Here is an [example](https://github.com/kuremichi/jasper/blob/master/examples/process%20flow/execution.order.example.test.ts) that shows the execution order for these hooks.

## For Rule

|  Hook   | Description  | 
| ------- | ---- | 
| beforeAction&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | task to run before the rule action starts. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; |
| afterAction | task to run after the rule action ends. |
| onError | task to run when error occurs |

The sequence is  
1. beforeAction 
2. ** action/dependency
3. ** dependency/action
4. afterAction
5. onError(if not caught before)  

**  depending on the direction. 

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

## For Composite Dependency

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
Each rule execution contains a [context](https://kuremichi.github.io/jasper/interfaces/executioncontext.html) from where you can find relevant information about current rule execution.  
If you use any of the hooks mentioned above, the context will be provided to you. 

|  Field   | Description  |
| ------- | ---- |
| root | this is the object that is passed to rule for evaluation |
| rule | this is the reference to current rule being executed|
| contextId | an identifier for the execution context. When suppressDuplicateTask is on, two executions for the same objects processed by the same rule will have the same contextId |
| contextData | this is a dictionary<string, any> that you could use to store some temp variable if needed when you use hooks | 
| parentContext | this will give you the ability to traverse the dependency execution and find the parent root if needed. |
| childrenContexts | an array of execution context for dependency rules execution started from current rule |

** Personally I believe each rule is a unit of work and the logic should be self-contained so you shouldn't need to access the parentContext, but ultimately it is your code and you decide what makes sense for you.
