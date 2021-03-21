import { EngineRecipe } from './enum';

export interface EngineOptions {
    suppressDuplicateTasks?: boolean;
    recipe: EngineRecipe;
    debug?: boolean;
}

export const DefaultEngineOptions: EngineOptions = {
    suppressDuplicateTasks: false,
    recipe: EngineRecipe.BusinessProcessEngine,
    debug: false,
};
