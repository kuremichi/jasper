import { EngineRecipe } from './enum';

export interface EngineOptions {
    /**
     * whether or not duplicate task against the same object should run multiple times.
     */
    suppressDuplicateTasks?: boolean;
    /**
     * rule engine recipe
     */
    recipe: EngineRecipe;
    /**
     * debug mode
     * setting this to true will bring back additional data for debugging purpose in execution response
     */
    debug?: boolean;
}

export const DefaultEngineOptions: EngineOptions = {
    suppressDuplicateTasks: false,
    recipe: EngineRecipe.BusinessProcessEngine,
    debug: false,
};
