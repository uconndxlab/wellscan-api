import Nutritionix from "./nutritionix";
import OpenFoodFacts from "./openfoodfacts";
import USDA from "./usda";

const off = new OpenFoodFacts();
//const nix = new Nutritionix();
const usda = new USDA();

let source_functions = [
//    nix.express_router.bind(nix),
    usda.express_router.bind(usda),
    off.express_router.bind(off)  
];
    
export default source_functions;