import Nutritionix from "./nutritionix";
import OpenFoodFacts from "./openfoodfacts";
import USDA from "./usda";

const off = new OpenFoodFacts();
const nix = new Nutritionix();
const usda = new USDA();

let source_functions = [
    usda.express_router.bind(usda),
    off.express_router.bind(off),
    //nix.express_router.bind(nix)
];
    
export default source_functions;