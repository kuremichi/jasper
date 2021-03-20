
export enum Operator {
    AND = 'AND',
    OR = 'OR',
}

export enum ExecutionOrder {
    Sequential = 'Sequential',
    Parallel = 'Parallel',
}

export enum JasperEngineRecipe {
    /*
        use this recipe if you want to perform validation against an object that will recursively validate all its children elements based
        on the rule specified.
    */
    ValidationRuleEngine,
    /*
        use this recipe if perform a series of actions depending on the business process rule
    */
    BusinessProcessEngine,
}
