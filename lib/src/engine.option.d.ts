import { JasperEngineRecipe } from './enum';
export interface EngineOptions {
    suppressDuplicateTasks?: boolean;
    recipe: JasperEngineRecipe;
    debug?: boolean;
}
export declare const DefaultEngineOptions: EngineOptions;
