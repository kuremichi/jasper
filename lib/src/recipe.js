"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JasperEngineRecipe = void 0;
var JasperEngineRecipe;
(function (JasperEngineRecipe) {
    /*
        use this recipe if you want to perform validation against an object that will recursively validate all its children elements based
        on the rule specified.
    */
    JasperEngineRecipe[JasperEngineRecipe["ValidationRuleEngine"] = 0] = "ValidationRuleEngine";
    /*
        use this recipe if perform a series of actions depending on the business process rule
    */
    JasperEngineRecipe[JasperEngineRecipe["BusinessProcessEngine"] = 1] = "BusinessProcessEngine";
})(JasperEngineRecipe = exports.JasperEngineRecipe || (exports.JasperEngineRecipe = {}));
//# sourceMappingURL=recipe.js.map