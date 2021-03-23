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
A rule is a unit of work. It could be a validation logic, a workflow process, a http request, or combinatation of the above and nested in multiple levels.


A simple rule could look like below.
```typescript

const validateCreditCard: rule


```

# 4. Dependencies
## Simple Dependency
A simple dependency is a dependency on a particular rule. The rule that is depended on could have its own dependencies (and then nested dependencies). That being said, a simple dependency is only simple in the sense of its configuration syntax.

## Composite Dependency
As the name suggests, a composite dependency is a dependency on one or more rules. A composite dependency could depend on Simple Dependencies and/or Composite Dependencies.

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

