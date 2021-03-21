- [1. Description](#1-description)
  - [Jasper Rule Engine](#jasper-rule-engine)
- [2. Quickstart](#2-quickstart)
- [3. Rule](#3-rule)
  - [Rule](#rule)
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
  - [3. onError](#3-onerror)
  - [For Simple Dependency](#for-simple-dependency)
  - [5. onDependencyError](#5-ondependencyerror)
  - [For Compositive Dependency](#for-compositive-dependency)
- [7. Execution Context](#7-execution-context)


# 1. Description
  ## Jasper Rule Engine
  Are you building an application that contains a lot of validation rules ?   
  Are you building an application that contains a lot of business workflow process ?   
  
  Here comes Jasper Rule Engine.

# 2. Quickstart
      To get started  
      npm install --save @jasper/jasper-engine  

```typescript


```

# 3. Rule
## Rule

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
1. beforeAction
2. afterAction
3. onError
---
## For Simple Dependency
1. beforeDependency
2. beforeEach
3. afterEach
4. afterDependency
5. onDependencyError
---
## For Compositive Dependency
1. beforeDependency
2. afterDependency
3. onDependencyError

# 7. Execution Context

