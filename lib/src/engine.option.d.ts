import { EngineRecipe } from './enum';
export interface EngineOptions {
    suppressDuplicateTasks?: boolean;
    recipe: EngineRecipe;
    debug?: boolean;
}
export declare const DefaultEngineOptions: EngineOptions;
