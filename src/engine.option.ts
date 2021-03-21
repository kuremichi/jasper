import { JasperEngineRecipe } from './enum';

export interface EngineOptions {
    suppressDuplicateTasks?: boolean;
    recipe: JasperEngineRecipe;
    debug?: boolean;
}

export const DefaultEngineOptions: EngineOptions = {
    suppressDuplicateTasks: false,
    recipe: JasperEngineRecipe.BusinessProcessEngine,
    debug: false,
};
